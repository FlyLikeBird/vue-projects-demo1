<template>
  <div id="app">
    <!-- <Ceshi msg='hello world' message='lala'/> -->
	<div :style="{ width:'100%', height:'100%'}">
		<EnergyFlow :sourceData="energyData"/>
	</div>
	<!-- <Watcher /> -->
	<!-- <DeepArray></DeepArray> -->
  </div>
</template>

<script>
import EnergyFlow from './components/EnergyFlow/index.vue';
import DeepArray from './components/DeepArray.vue';
// import Watcher from './components/Watcher.vue';
// import Ceshi from './components/ceshi.vue';
let str = '[{"totalCost":3408.51,"totalEnergy":598050,"attr_id":126,"attr_name":"宿舍区","output":0,"cost":{"ele":3408.51},"energy":{"ele":"598050"}},{"totalCost":454.29,"totalEnergy":72929,"attr_id":139,"attr_name":"国鹏","output":0,"cost":{"ele":454.29},"energy":{"ele":"72929"}},{"totalCost":12853.28,"totalEnergy":2212461,"attr_id":140,"attr_name":"生产设备","output":0,"cost":{"ele":12853.28},"energy":{"ele":"2212461"}},{"totalCost":48914.45,"totalEnergy":8444151,"attr_id":155,"attr_name":"生产区","output":0,"cost":{"ele":48914.45},"energy":{"ele":"8444151"}}]';

let data = [
    {
        "totalCost": 3408.51,
        "totalEnergy": 598050,
        "attr_id": 126,
        "attr_name": "宿舍区",
        "output": 0,
        "cost": {
            "ele": 3408.51,
			"water":2000,
			"gas":1000
        },
        "energy": {
            "ele": "598050",
			"water":"50000",
			"gas":2000
        }
    },
    {
        "totalCost": 454.29,
        "totalEnergy": 72929,
        "attr_id": 139,
        "attr_name": "国鹏",
        "output": 0,
        "cost": {
            "ele": 454.29,
			"water":3000,
			"gas":3000
        },
        "energy": {
            "ele": "72929",
			"water":"60000",
			"gas":3000
			
        }
    },
    {
        "totalCost": 12853.28,
        "totalEnergy": 2212461,
        "attr_id": 140,
        "attr_name": "生产设备",
        "output": 0,
        "cost": {
            "ele": 12853.28,
			"water":10000,
			"gas":1000
        },
        "energy": {
            "ele": "2212461",
			"water":200000,
			"gas":1000
			
        }
    },
    {
        "totalCost": 48914.45,
        "totalEnergy": 8444151,
        "attr_id": 155,
        "attr_name": "生产区",
        "output": 0,
        "cost": {
            "ele": 48914.45,
			"water":22000,
			"gas":5000
			
        },
        "energy": {
            "ele": "8444151",
			"water":300000,
			"gas":5000
		
        }
    }
]

export default {
  name: 'App',
  data(){
	  return {
		  energyData:data
	  }
  },
  components: {
	// Ceshi,
	EnergyFlow,
	DeepArray
	// Watcher
  },
}

</script>

<style>
html,body {
	width:100%;
	margin:0;
	padding:0;
	height:100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height:100%;
}
</style>
