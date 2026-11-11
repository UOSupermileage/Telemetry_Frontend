import { test, expect } from 'vitest'
import { pairedRegression, describeCorrelation } from './scatterStatistics.js'
test('strong positive',()=>{const v=pairedRegression([{x:1,y:2},{x:2,y:4},{x:3,y:6}],'x','y');expect(v.n).toBe(3);expect(Math.abs(v.r-1)).toBeLessThan(1e-12);expect(Math.abs(v.slope-2)).toBeLessThan(1e-12);expect(v.r2).toBe(1)})
test('strong negative',()=>{const v=pairedRegression([{x:1,y:3},{x:2,y:2},{x:3,y:1}],'x','y');expect(Math.abs(v.r+1)).toBeLessThan(1e-12)})
test('uncorrelated',()=>{const v=pairedRegression([{x:1,y:1},{x:2,y:3},{x:3,y:1}],'x','y');expect(Math.abs(v.r)).toBeLessThan(1e-12)})
test('missing values are excluded but zero included',()=>{const v=pairedRegression([{x:0,y:0},{x:null,y:3},{x:1,y:2},{x:2,y:''}],'x','y');expect(v.n).toBe(2);expect(v.excluded).toBe(2);expect(v.r).toBe(1)})
test('constant x undefined',()=>{const v=pairedRegression([{x:1,y:3},{x:1,y:4}],'x','y');expect(v.r).toBe(null)})
test('empty undefined',()=>{const v=pairedRegression([], 'x','y'); expect(v.n).toBe(0);expect(v.r).toBe(null)})
test('correlation language not causal',()=>{expect(describeCorrelation(.8)).toMatch(/strong positive/);expect(describeCorrelation(null)).toMatch(/Not estimable/)})
