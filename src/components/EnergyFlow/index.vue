
<template>
	<div class='container'>
		<div v-if="chartLoading">
			<span>loading</span>
		</div>
		<div v-else-if="!attrsData.attrsCost && !attrsData.attrsCost['ele']"></div>
		<canvas
			id='my-canvas'
			width='1200px'
			height='500px'
			:style="{backgroundColor:'#f7f7f7'}"
		></canvas>
		
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
						let rectY = seriesHeight + sumHeight(attrsCost[energyType], j) ;
						let width = flowDistance + sumAttrWidth(attrs, j);
						let itemHeight = attr.itemHeight - margin;
						if ( energyType === 'ele' ){
							attr.rectY = rectY + attr.itemHeight/2;
							attr.rectX = flowPoint;
							attr.width = width;
							attr.height = attr.itemHeight - margin;
						} else {
							// console.log(rectY);
							let pathStartY = rectY + attr.itemHeight/2 ;
							let pathEndY = sumHeight(attrsCost['ele'], j) + attrsCost['ele'][j].itemHeight;
							let pathWidth = width + itemHeight/2 ;
							let pathLength = ( pathWidth - flowPoint)  // 横向路径
											+ ( pathStartY - pathEndY ) // 竖向路径
							attr.pathStartX = flowPoint;
							attr.pathStartY = pathStartY;
							attr.height = attr.itemHeight - margin;
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
				// console.log(attrsCost);
				return { attrsCost, attrs };
			}
		},
		mounted(){
			let canvas = document.getElementById('my-canvas');
			let ctx = canvas.getContext('2d');
			if ( ctx ){
				let { attrsCost, attrs } = this.attrsData;
				this.drawAttrs(ctx, attrs);
				this.drawEnergyFlow(ctx, attrsCost);
				this.drawEnergyEntry(ctx, this.entryCost);
			}
		},
		methods:{
			toggleChartLoading(){
				return !this.chartLoading
			},
			drawAttrs(ctx, data){
				console.log(data);
				data.forEach((item,i)=>{
					ctx.fillStyle = '#2c3b4d';
					ctx.fillRect(item.rectX, item.rectY, item.attr_width, item.itemHeight)
				})
			},
			drawEnergyFlow(ctx, data){
				console.log(data);
				data.forEach((item,i)=>{
					ctx.beginPath();
					if ( item.type === 'ele' ) {
						ctx.moveTo(item.rectX, item.rectY);
						ctx.lineTo(item.width, item.rectY);
					} else if ( item.type === 'water' ){
						console.log(item.pathStartY);
						ctx.moveTo(item.pathStartX, item.pathStartY);
						ctx.lineTo(item.pathWidth, item.pathStartY);
						ctx.lineTo(item.pathWidth, item.pathEndY);
					}
					ctx.strokeStyle=item.color;
					ctx.lineWidth = item.height;
					ctx.stroke();
					ctx.closePath();
					ctx.textBaseline = 'middle';
					ctx.font='14px sans-serif';
					ctx.fillStyle='#fff';
					ctx.fillText(`￥${Math.floor(item.cost)}元 / ${Math.floor(item.energy)}kwh`, item.rectX + 20, item.rectY);	
				})
				
			},
			drawEnergyEntry(ctx, data){
				console.log(data);
				data.forEach((item,i)=>{
					ctx.beginPath();
					ctx.fillStyle=item.color;
					ctx.fillRect(item.rectX, item.rectY, item.width, item.height);
					// ctx.fillRect(item.rectX)
				})
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
	#my-canvas {
		
	}
	
</style>
