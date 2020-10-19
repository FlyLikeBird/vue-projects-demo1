import Vue from 'vue';

const button = Vue.component('button-counter',{
    data:function(){
        return {
            count:0
        }
    },
    template:'<button v-on:click="count++">You clicked me {{ count }} times.</button>'
})
console.log(button);