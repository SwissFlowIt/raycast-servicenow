"use strict";var i=Object.defineProperty;var l=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var f=Object.prototype.hasOwnProperty;var m=(t,e)=>{for(var a in e)i(t,a,{get:e[a],enumerable:!0})},d=(t,e,a,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of u(e))!f.call(t,s)&&s!==a&&i(t,s,{get:()=>e[s],enumerable:!(o=l(e,s))||o.enumerable});return t};var p=t=>d(i({},"__esModule",{value:!0}),t);var y={};m(y,{default:()=>w});module.exports=p(y);var n=require("@raycast/api"),w=async t=>{let{instanceName:e,query:a}=t.arguments,o=await n.LocalStorage.getItem("saved-instances");if(!o){(0,n.showToast)(n.Toast.Style.Failure,"No instances found","Please create an instance profile first");return}let r=JSON.parse(o).find(c=>c.name.toLowerCase()===e.toLowerCase()||c.alias?.toLowerCase()===e.toLowerCase());if(!r){(0,n.showToast)(n.Toast.Style.Failure,"Instance not found",`No instance found with name or alias: ${e}`);return}n.LocalStorage.setItem("selected-instance",JSON.stringify(r)),await(0,n.launchCommand)({name:"quickly-search-selected-instance",type:n.LaunchType.UserInitiated,arguments:{query:a},context:{instanceName:e}})};
