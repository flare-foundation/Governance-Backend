export async function sleepms(milliseconds: number) {
   await new Promise((resolve: any) => {
     setTimeout(() => {
       resolve();
     }, milliseconds);
   });
 }
 
 export function round(x: number, decimal: number = 0) {
   if (decimal === 0) return Math.round(x);
 
   const dec10 = 10 ** decimal;
 
   return Math.round(x * dec10) / dec10;
 }
 