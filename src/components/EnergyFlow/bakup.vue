<template>
	<div class='container'>
		<div v-if="chartLoading">
			<span>loading</span>
		</div>
		<div v-else-if="!attrsData.attrsCost && !attrsData.attrsCost['ele']"></div>
		<svg
			v-else
			class='svg-container'
			preserveAspectRatio="xMidYMid meet" 
			:viewBox='`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`'
		>
			<!-- 维度属性 -->
			<g v-for="attr in attrsData.attrs" :key="attr.attr_id">
				<rect 
					:x="attr.rectX"
					:y="attr.rectY" 
					:width="attr.attr_width" 
					:height="attr.itemHeight" 
					:style='{ fill:"#2c3b4d"}'                
				/>
				<text 
					fill='#fff' 
					:style="{ cursor:'pointer' }" 
					alignment-baseline='middle' 
					text-anchor='middle'
					:x="attr.rectX + attr.attr_width/2"
					:y="attr.rectY + attr.itemHeight/2"
				>{{ attr.attr_name }}</text>
				<text
					fill='#000'
					font-size="12px"
					alignment-baseline='middle'
					text-anchor='middle'
					:x="attr.rectX + attr.attr_width/2"
					:y="attr.rectY - 4"
				>{{ `${Math.floor(attr.attr_output)}元/万元产值` }}</text>
			</g>
			<!-- 能流图分流部分-->
			<g v-for="(item, i) in attrsData.attrsCost" :key="i">
				<rect 
					v-if="item.type === 'ele'"
					:x="item.rectX"
					:y="item.rectY"
					:width="item.width"
					:data-width="item.width"
					:height="item.height"
					:style="{ fill:item.color, transition:'all 1s'}"
				/>
				<path
					v-else
					:d="`M${item.pathStartX} ${item.pathStartY} H${item.pathWidth} V${item.pathEndY}`"
					:stroke="item.strokeColor"
					fill='none'
					:stroke-width="item.strokeWidth"
					:class="`energy-${i}`"
					:style="{ transition:'all 1s'}"
				/>
				<text 
					alignment-baseline='middle' 
					text-anchor='left' 
					fill='#fff' 
					:x=" item.type === 'ele' ? item.rectX + 20 : item.pathStartX + 20" 
					:y=" item.type === 'ele' ? item.rectY + item.itemHeight/2 : item.pathStartY"
				>
					{{ `￥${Math.floor(item.cost)}元 / ${Math.floor(item.energy)}kwh` }}
				</text>
			</g>
			<!-- 能源入口 -->
			<g v-for="(item, i) in entryCost" :key="'entry-'+i">
				<rect
					:x="item.rectX"
					:y="item.rectY"
					:style="{ fill:item.color }"
					:width="item.width"
					:height="item.height"
				/>
				<text
					alignment-baseline='middle'
					text-anchor='left' 
					fill='#fff' 
					:x="item.pointX" 
					:y="item.pointY"
				>{{ item.text }}</text>
			</g>
		</svg>
	</div>
</template>

<script>
	import { findMinEnergyCost, sumAttrWidth, sumHeight, sumVerticalWidth } from './utils.js';
	let padding = 60;
	let margin = 2;
	let attrBoxWidth = 100;
	let attrBoxHeight = 20;
	let minHeight = 16;
	let maxHeight = minHeight * 16;
	const strokeColor = '#f7f7f7';
	// 汇总能源起始位置
	// 能源流向起始位置
	let entryPoint = 0;
	let flowPoint = 140;
	let flowDistance = 460;
	
	const energyColors = {
	    'ele':'#57e29f',
	    'water':'#09c1fd',
	    'gas':'#0070c0',
	    'hot':'#f9cb3e'
	};
	export default {
		props:['sourceData'],
		data:function(){
			return {
				chartLoading:false,
				entryCost:[],
				viewBox:{ x:0, y:0, width:0, height:0 }
			}
		},
		computed:{
			attrsData:function(){
				let { attrsCost, attrs } = findMinEnergyCost(this.sourceData);
				// 维度列表
				attrs = attrs.map((attr,i)=>{
					attr.rectX = flowDistance + sumAttrWidth(attrs, i);
					attr.rectY = sumHeight(attrsCost['ele'],i);
					attr.itemHeight = attrsCost['ele'][i].itemHeight - margin;
					return attr;
				});
				// 能源分流添加定位信息
				Object.keys(attrsCost).map((energyType, i)=>{
					let seriesHeight = i === 0 ? 0 : Object.keys(attrsCost).slice(0, i).map(key=>attrsCost[key]).reduce((sum,cur)=>{
						let temp = sumHeight(cur, cur.length);
						sum+=temp;
						return sum;
					},0);
					let rectHeight = sumHeight(attrsCost[energyType], attrsCost[energyType].length) - margin;
					this.entryCost.push({
						type:energyType,
						text: energyType === 'ele' ? '电' : energyType === 'water' ? '水' : energyType === 'gas' ? '气' : energyType === 'hot' ? '热' : '',
						color:energyColors[energyType],
						rectX:entryPoint,
						rectY:seriesHeight,
						pointX:flowPoint/2,
						pointY:seriesHeight + rectHeight/2,
						width:flowPoint - margin,
						height:rectHeight
					});
					attrsCost[energyType].map((attr,j)=>{
						let rectY = seriesHeight + sumHeight(attrsCost[energyType], j);
						let width = flowDistance + sumAttrWidth(attrs, j) - flowPoint;
						let itemHeight = attr.itemHeight - margin;
						if ( energyType === 'ele' ){
							attr.rectY = rectY;
							attr.rectX = flowPoint;
							attr.width = width;
							attr.height = attr.itemHeight - margin;
						} else {
							let pathStartY = rectY + attr.itemHeight/2;
							let pathEndY = sumHeight(attrsCost['ele'], j) + attrsCost['ele'][j].itemHeight;
							let pathWidth = width + flowPoint + itemHeight/2 + sumVerticalWidth(attrsCost, i, j);
							let pathLength = ( pathWidth - flowPoint)  // 横向路径
											+ ( pathStartY - pathEndY ) // 竖向路径
							attr.pathStartX = flowPoint;
							attr.pathStartY = pathStartY;
							attr.pathEndY = pathEndY;
							attr.pathWidth = pathWidth;
							attr.pathLength = pathLength;
							attr.strokeColor = energyColors[attr.type];
							attr.strokeWidth = attr.itemHeight - margin;
						}
						attr.type = energyType;
						attr.color = attr.cost ? energyColors[energyType] : '#fff'
					})
				});
				// 将能源层级关系扁平化
				attrsCost = Object.keys(attrsCost).map(key=>attrsCost[key]).reduce((sum,cur)=>{
					return sum.concat(cur)
				},[]);
				console.log(attrsCost);
				return { attrsCost, attrs };
			}
		},
		mounted(){
			let containerWidth = this.$el.offsetWidth;
			let containerHeight = this.$el.offsetHeight;  
			let { attrsCost, attrs } = this.attrsData;
			let chartWidth = flowDistance + sumAttrWidth(attrs, attrs.length);
			let chartHeight = this.entryCost.reduce((sum,cur)=> {
				sum+=cur.height;
				return sum;
			},0);
			let xRatio = chartWidth /  containerWidth ;
			let yRatio = chartHeight / containerHeight;
			// 选择缩放比例大的轴的比例，确保整个图形完整显示出来，不会被裁剪掉
			// finalRatio = xRatio < yRatio ? yRatio : xRatio;      
			let finalWidth = Math.floor( containerWidth * xRatio) ;
			let finalHeight = Math.floor( containerHeight * yRatio ) ;
			this.viewBox = { x:0, y:0, width:finalWidth, height:finalHeight };
		},
		methods:{
			toggleChartLoading(){
				return !this.chartLoading
			}
		}
	}
</script>

<style scoped>
	.container {
		width:100%;
		height:100%;
		position:relative;
	}
	.svg-container {
		width:100%;
		height:100%;
		overflow: visible;
	}
</style>
