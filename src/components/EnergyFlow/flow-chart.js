import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Spin, Skeleton, Tooltip, Button, message } from 'antd';
import { LoginOutlined, LogoutOutlined, HomeOutlined, ToTopOutlined } from '@ant-design/icons';

// 调整比例 最大值和最小值的比例设定为20倍
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

function getTypeEnergy(arr, minCost, maxCost, type){
    let splitMode = +maxCost/+minCost >= 20 ? true : false;
    return arr.map((item,i)=>{
        let obj = {};
        obj.attr_id = item.attr_id;
        obj.attr_name = item.attr_name;
        obj.attr_output = item.attr_output;
        obj.cost = item.cost;
        obj.type = type;
        obj.energy = item.energy;
        // 如果成本值不为0 ，根据最小值计算相应比例，如果为0并且是电能源时，等于默认盒子最小高度
        // 如果最大值和最小值的差值过大，则采取限定比例分割(splitMode)，否则就按成本的正常比例
        if ( splitMode ){
            obj.itemHeight = item.cost 
                ?
                item.cost === minCost 
                ?
                minHeight
                :
                item.cost === maxCost
                ?
                maxHeight
                : 
                Math.round((item.cost/minCost)/(maxCost/minCost) * maxHeight)
                : 
                type === 'ele' 
                ?
                minHeight 
                : 
                0;
        } else {
            obj.itemHeight = item.cost 
                    ?
                    item.cost === minCost 
                    ?
                    minHeight
                    :
                    Math.round((item.cost/minCost) * minHeight)
                    :
                    type === 'ele'
                    ?
                    minHeight
                    :
                    0
        }
        obj.totalCost = item.totalCost;
        obj.totalEnergy = item.totalEnergy;
        return obj;
    })
}

function findMinEnergyCost(arr){
    if ( !arr || !arr.length ) return {};
    let attrsCost = {}, attrs = [], minCost, maxCost, attrsWidth = {};
    // 其他能源在横向轴的占比
    let attrEnergyPercent={}; 
    arr.forEach(item=>{
        attrs.push({ attr_id:item.attr_id, attr_name:item.attr_name, attr_output:item.output });
        let { ele, ...rest } = item.cost;
        let tempObj = {};
        let tempSum = 0;
        // 计算出各个维度属性其他能源的占比情况
        Object.keys(rest).forEach(key=>{
            tempSum += rest[key];
        });
        Object.keys(rest).forEach(key=>{
            if ( rest[key] ) {
                tempObj[key] =  Math.floor(rest[key]/tempSum*100);
            }
        }); 
        attrEnergyPercent[item.attr_name] = tempObj;
        Object.keys(item.cost).forEach(key=>{
            if ( key === 'ele' || key === 'water' || key === 'gas') {
                if(!attrsCost[key]){
                    attrsCost[key] = [];                   
                    attrsCost[key].push({ cost:item.cost[key], attr_id:item.attr_id, attr_name:item.attr_name, attr_output:item.output, energy:item.energy[key], totalCost:item.totalCost, totalEnergy:item.totalEnergy });                               
                } else {
                    attrsCost[key].push({ cost:item.cost[key], attr_id:item.attr_id, attr_name:item.attr_name, attr_output:item.output, energy:item.energy[key], totalCost:item.totalCost, totalEnergy:item.totalEnergy } );          
                }
            }
            
        });
    });
    let temp=[];
    // 找出能源流向中的最小成本，以最小值作为比例基本, 排除掉最小值为0的情况
    Object.keys(attrsCost).forEach(key=>{ 
        temp = temp.concat(attrsCost[key].map(i=>i.cost).filter(i=>i));
    });
    temp = temp.sort((a,b)=>a-b);
    minCost =  temp[0];
    maxCost = temp[temp.length-1];
    Object.keys(attrsCost).map(key=>{
        attrsCost[key] = getTypeEnergy(attrsCost[key], minCost, maxCost, key);
    });
    // 计算出每个维度属性盒子的宽度
    let { ele, ...rest } = attrsCost;
    let restEnergys = Object.keys(rest).map(key=>attrsCost[key]);
    attrs.forEach((attr, i)=>{
        let attr_width = getAttrWidth(restEnergys,i)
        attr.attr_width = attr_width < attrBoxWidth ? attrBoxWidth : attr_width;
    });
    return {
        attrs,
        attrsCost,
        attrEnergyPercent,
        minCost
    }
}

function getAttrWidth(arr, i){
    let sum = 0;
    arr.forEach(item=>{
        sum+=item[i].itemHeight;
    });
    return sum;
}

function sumAttrWidth(arr, i){
    let sum = 0;
    if ( i===0 ) return sum;
    sum = arr.slice(0, i).reduce((sum,cur)=>sum+= cur.attr_width ,0);
    return sum;
}

// 累加Y轴坐标值
function sumHeight(typeEnergy, i){
    let sum = 0;
    if ( i === 0) return sum;
    sum = typeEnergy.slice(0,i).reduce((sum,cur)=>sum+=cur.itemHeight,0)
    return sum;  
}


function sumVerticalWidth(attrsCost, i, j){
    let sum = 0;
    if ( i === 0 || i === 1 ) return sum;
    let { ele, ...rest } = attrsCost;
    Object.keys(rest).slice(0,i-1).map(key=>{
        sum += attrsCost[key][j].itemHeight;
    })
    return sum;
}

function EfficiencyFlowChart({ data, levelInfo, chartLoading, onFetchData, onSetLevel, mode }){     
    const containerRef = useRef();
    const { attrsCost, attrs, minCost } = findMinEnergyCost(data);
    const [viewBox, setViewBox] = useState({ x:0, y:0, width:0, height:0 });
    const [timeType, toggleTimeType] = useState('2');
    console.log(data);
    console.log(attrsCost);
    useEffect(()=>{
        if( attrsCost && attrsCost['ele'] ){
            // 控制能流图的整体缩放
            let containerWidth = containerRef.current.offsetWidth;
            let containerHeight = containerRef.current.offsetHeight;     
            let chartWidth = flowDistance + sumAttrWidth(attrs, attrs.length);
            let chartHeight = Object.keys(attrsCost).map(i=>attrsCost[i]).reduce((sum,cur)=>{
                let temp = sumHeight(cur, cur.length);
                sum+= temp;
                return sum;
            },0);
            
            let xRatio = chartWidth /  containerWidth ;
            let yRatio = chartHeight / containerHeight;
            // 选择缩放比例大的轴的比例，确保整个图形完整显示出来，不会被裁剪掉
            // finalRatio = xRatio < yRatio ? yRatio : xRatio;      
            let finalWidth = Math.floor( containerWidth * xRatio) ;
            let finalHeight = Math.floor( containerHeight * yRatio ) ;
            setViewBox({ x:0, y:0, width:finalWidth, height:finalHeight });
        }
    },[data]);
    useEffect(()=>{
        // 异步生成动效
        if ( attrsCost && attrsCost['ele'] ){
            let types = Object.keys(attrsCost);
            for(var i=0;i<types.length;i++){
                (function(i){
                    setTimeout(()=>{
                        // console.log(i);
                        let doms = document.getElementsByClassName(`energy-${i}`);
                        for(let j=0;j<doms.length;j++){
                            if ( i === 0 ) {
                                doms[j].style.width = doms[j].getAttribute('data-width');
                            } else {
                                doms[j].style.strokeDashoffset = 0;
                            
                            }
                        }
                    },i*1000)
                })(i)
            }
        }                    
    },[data])
    // console.log(attrs);
    // console.log(attrsCost);
    console.log(levelInfo);
    console.log(chartLoading);
    
    return (
        <div style={{width:'100%', height:'100%', position:'relative' }} ref={containerRef} >
            
            {/* 控制能流图展示层级 */}
            {
                chartLoading
                ?
                null
                :
                !attrsCost || !attrsCost['ele'] 
                ?
                null
                :
                <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:'-40px'}}>
                    {/* 控制时间维度，按年度/月度 */}
                    <Radio.Group 
                        size='small' 
                        value={timeType} 
                        className='flow-chart-button'
                        onChange={e=>{
                            let currentParentNode = levelInfo.parentNodes[levelInfo.parentNodes.length-1];
                            onFetchData({ timeType:e.target.value, attr_id:currentParentNode ? currentParentNode.attr_id : null });
                            toggleTimeType(e.target.value);
                    }}>
                        <Radio.Button key='1' value='1'>年度</Radio.Button>
                        <Radio.Button key='2' value='2'>月度</Radio.Button>
                    </Radio.Group>
                    <Tooltip title='返回上一层级'>
                        <div style={{ margin:'8px 0'}} onClick={()=>{
                            if ( levelInfo.currentLevel === 1 ){
                                message.info('当前已经是根层级了');
                            } else {
                                if ( levelInfo.parentNodes && levelInfo.parentNodes.length ){
                                    let parentNodeIndex = levelInfo.parentNodes.length - 2;
                                    new Promise((resolve, reject)=>{
                                        if ( parentNodeIndex >= 0 ){
                                            onFetchData({ attr_id:levelInfo.parentNodes[parentNodeIndex].attr_id, resolve, reject, timeType });
                                        } else {
                                            onFetchData({ resolve, reject, timeType } );
                                        }
                                    })
                                    .then(()=>{
                                        if ( parentNodeIndex >= 0 ){
                                            levelInfo.parentNodes.pop();
                                            onSetLevel({ currentLevel:--levelInfo.currentLevel, parentNodes:levelInfo.parentNodes} );
                                        } else {
                                            onSetLevel({ currentLevel:1, parentNodes:[]} );    
                                        }                                    
                                    })
                                    .catch(msg=>{
                                        message.info(msg);
                                    })
                                }
                            }
                        }}>
                            <Button shape='circle' icon={<ToTopOutlined /> } />
                        </div>
                    </Tooltip>
                    <Tooltip title='返回根层级'>
                        <div style={{ margin:'8px 0'}} onClick={()=>{
                            if ( levelInfo.currentLevel === 1 ){
                                message.info('当前已经是根层级了');
                            } else {
                                new Promise((resolve, reject)=>{
                                    onFetchData({ timeType, resolve, reject } );
                                })
                                .then(()=>{
                                    onSetLevel({ currentLevel:1, parentNodes:[] });    
                                })
                            } 
                        }}>
                            <Button shape='circle' icon={<HomeOutlined />} />

                        </div>
                    </Tooltip>
                </div>
            }
            
            {
                chartLoading
                ?
                <Spin size='large' style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)' }} />
                :
                !attrsCost || !attrsCost['ele'] 
                ?
                null
                :
                <svg 
                    width='100%' 
                    height='100%' 
                    style={{ overflow:'visible'}}
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                    preserveAspectRatio="xMidYMid meet" 
                >
                    {
                        // 计量区域维度列表
                        attrs && attrs.length
                        ?
                        attrs.map((attr,i)=>(                            
                            (function(attr,i){
                                let rectX = flowDistance + sumAttrWidth(attrs, i);
                                let rectY = sumHeight(attrsCost['ele'], i);
                                let itemHeight = attrsCost['ele'][i].itemHeight - margin;
                                return (
                                    <g key={attr.attr_id}>
                                        <rect 
                                            x={rectX} 
                                            y={rectY} 
                                            width={ attr.attr_width - margin} 
                                            height={itemHeight} 
                                            style={{fill:'#2c3b4d'}}                
                                        />
                                        <text fill='#fff' onClick={()=>{
                                            new Promise((resolve, reject)=>{
                                                onFetchData({ attr_id:attr.attr_id, timeType, resolve, reject });
                                            })
                                            .then(()=>{
                                                levelInfo.parentNodes.push(attr);
                                                onSetLevel({ currentLevel:++levelInfo.currentLevel, parentNodes:levelInfo.parentNodes });
                                            })
                                            .catch((msg)=>{                                          
                                                message.info(msg);
                                            })
                                            
                                        }} style={{ cursor:'pointer' }} alignmentBaseline='middle' textAnchor='middle' x={`${rectX + attr.attr_width/2}`} y={rectY + itemHeight/2}>{`${attr.attr_name}`}</text>
                                        <text fill={ mode === 'dark' ? '#fff' : '#000' } fontSize='12px' alignmentBaseline='bottom' textAnchor='middle' x={`${rectX + attr.attr_width/2}`} y={rectY - 4} >{ `${Math.floor(attr.attr_output)}元/万元产值` }</text>
                                    </g>
                                );
                            })(attr,i)
                        ))
                        :
                        null
                    }
                    {
                        // 能源分流向图形
                        Object.keys(attrsCost).map((energyKey,i)=>{ 
                            // 各个能源种类累加的总高度
                            let seriesHeight = i === 0 ? 0 :  Object.keys(attrsCost).slice(0,i).map(i=>attrsCost[i]).reduce((sum,cur)=>{
                                let temp = sumHeight(cur, cur.length);
                                sum+= temp;
                                return sum;
                            },0);  
                            return attrsCost[energyKey].map((attr,j)=>(
                                (function(attr,j){
                                     // 横向轴坐标值   
                                    let currentItemHeight = sumHeight(attrsCost[energyKey], j );                                 
                                    let rectY = seriesHeight + currentItemHeight;
                                    let itemHeight = attr.itemHeight - margin ;
                                    let width = flowDistance + sumAttrWidth(attrs, j) - flowPoint;
                                    // 其他能源描边坐标值
                                    let pathWidth = width  + flowPoint + itemHeight/2 + sumVerticalWidth(attrsCost, i, j);
                                    let pathStartY = rectY + attr.itemHeight/2;
                                    let pathEndY = sumHeight(attrsCost['ele'], j) + attrsCost['ele'][j].itemHeight;
                                    
                                    let pathLength = ( pathWidth- flowPoint ) // 横向路径
                                                    + ( pathStartY - pathEndY ) // 竖向路径
                                    let outputText = `${Math.floor(attr.attr_output)}元/万元产值`;                              
                                    return (
                                        <g key={`${i}-${j}`}>
                                            {
                                                attr.type === 'ele'
                                                ?
                                                <rect
                                                    x={flowPoint}
                                                    y={rectY}
                                                    width={ attr.cost ? '0' : width}
                                                    data-width={width}
                                                    height={itemHeight}
                                                    className={`energy-${i}`}
                                                    style={{ fill : attr.cost ?  energyColors['ele'] : mode === 'dark' ? '#091935' : '#fff', transition:'all 1s'  }}
                                                >
                                                </rect>
                                                :                            
                                                attr.cost 
                                                ?
                                                <path
                                                    d={`M${flowPoint} ${pathStartY} H${pathWidth} V${pathEndY}`}
                                                    stroke={ energyColors[attr.type] }
                                                    fill='none'
                                                    strokeWidth={attr.itemHeight - margin} 
                                                    className={`energy-${i}`}
                                                    strokeWidth={attr.itemHeight - margin} 
                                                    strokeDasharray={`${pathLength} ${pathLength}`}
                                                    strokeDashoffset={pathLength}
                                                    style={{ transition:'all 1s'}}
                                                />
                                                :
                                                null                                                                                               
                                            }
                                            <text alignmentBaseline='middle' textAnchor='left' fill='#fff' x={ flowPoint + 20 } y={rectY+(itemHeight/2)}>{ `￥${Math.floor(attr.cost)}元 / ${Math.floor(attr.energy)}kwh`}</text>
                                            
                                        </g>
                                    )
                                })(attr,j)
                            ))

                        })
                    }
                    {
                        // 能源入口图形
                        Object.keys(attrsCost).map((energyKey,i)=>{
                            let seriesHeight = i === 0 ? 0 :  Object.keys(attrsCost).slice(0,i).map(i=>attrsCost[i]).reduce((sum,cur)=>{
                                let temp = sumHeight(cur, cur.length);
                                sum+= temp;
                                return sum;
                            },0);
                            let rectX = entryPoint;
                            let rectY = seriesHeight;
                            let rectHeight = sumHeight(attrsCost[energyKey], attrsCost[energyKey].length) - margin;
                            let energyType = energyKey === 'ele' ? '电' :
                            energyKey === 'water' ? '水' :
                            energyKey === 'gas' ? '气' :
                            energyKey === 'hot' ? '热' : '';
                            return (
                                <g key={energyKey}>
                                    <rect 
                                        x={rectX} 
                                        y={rectY} 
                                        width={flowPoint - margin} 
                                        height={rectHeight} 
                                        style={{fill: energyColors[energyKey] }}
                                    />
                                    <text alignmentBaseline='middle' textAnchor='middle' x={ flowPoint/2 } y={rectY+(rectHeight/2)}>{ energyType } </text>
                                </g>
                            )
                        })
                    }
                    {
                        // 当前层级标题
                        levelInfo && levelInfo.currentLevel === 1
                        ?
                        null
                        :
                        <text fill={ mode === 'dark' ? '#fff' : '#000'} alignmentBaseline='bottom' textAnchor='middle' x={(flowDistance + sumAttrWidth(attrs, attrs.length))/2} y={0} >{ levelInfo.parentNodes.length ? levelInfo.parentNodes[levelInfo.parentNodes.length-1].attr_name : '' }</text>
                    }
                </svg>
            }
            
        </div>
    )
        
}

function areEqual(prevProps, nextProps){
    if ( prevProps.data !== nextProps.data || prevProps.levelInfo !== nextProps.levelInfo || prevProps.chartLoading !== nextProps.chartLoading  ) {
        return false;
    } else {
        return true;
    }
}

export default React.memo(EfficiencyFlowChart, areEqual);
