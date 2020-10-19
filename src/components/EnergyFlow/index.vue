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
			<!-- 能流图分流部分 电能源-->
			<g v-for="(item, i) in attrsData.attrsCost['ele']" :key="i">
				<rect 
					:x="item.rectX"
					:y="item.rectY"
					:width="item.width"
					:data-width="item.width"
					:height="item.height"
					:style="{ fill:item.color, transition:'all 1s'}"
				/>
				<text alignment-baseline='middle' text-anchor='left' fill='#fff' :x="item.rectX + 20" :y="item.rectY + item.itemHeight/2">
					{{ `￥${Math.floor(item.cost)}元 / ${Math.floor(item.energy)}kwh` }}
				</text>
			</g>
			<!-- 能流图分流部分 其他能源-->
			<g v-for="(seriesEnergy, i) in Object.keys(attrsData.attrsCost).filter(i=>i!=='ele').map(key=>attrsData.attrsCost[key])" :key="i">
				<g
					v-for="(item, j) in seriesEnergy"
					:key="j"
				>
					<path />
				</g>
			</g>
		</svg>
	</div>
</template>

<script>
	import { findMinEnergyCost, sumAttrWidth, sumHeight } from './utils.js';
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
			console.log(this);
			return {
				chartLoading:false,
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
					attrsCost[energyType].map((attr,j)=>{
						let rectY = seriesHeight + sumHeight(attrsCost[energyType], j);
						let width = flowDistance + sumAttrWidth(attrs, j) - flowPoint;
						attr.rectY = rectY;
						attr.rectX = flowPoint;
						attr.width = width;
						attr.height = attr.itemHeight - margin;
						attr.color = attr.cost ? energyColors[energyType] : '#fff'
					})
				});
				console.log(attrsCost);
				return { attrsCost, attrs };
			}
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
