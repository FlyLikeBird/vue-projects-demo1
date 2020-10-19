
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

export function getTypeEnergy(arr, minCost, maxCost, type){
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

export function findMinEnergyCost(arr){
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

export function getAttrWidth(arr, i){
    let sum = 0;
    arr.forEach(item=>{
        sum+=item[i].itemHeight;
    });
    return sum;
}

export function sumAttrWidth(arr, i){
    let sum = 0;
    if ( i===0 ) return sum;
    sum = arr.slice(0, i).reduce((sum,cur)=>sum+= cur.attr_width ,0);
    return sum;
}

// 累加Y轴坐标值
export function sumHeight(typeEnergy, i){
    let sum = 0;
    if ( i === 0) return sum;
    sum = typeEnergy.slice(0,i).reduce((sum,cur)=>sum+=cur.itemHeight,0)
    return sum;  
}


export function sumVerticalWidth(attrsCost, i, j){
    let sum = 0;
    if ( i === 0 || i === 1 ) return sum;
    let { ele, ...rest } = attrsCost;
    Object.keys(rest).slice(0,i-1).map(key=>{
        sum += attrsCost[key][j].itemHeight;
    })
    return sum;
}