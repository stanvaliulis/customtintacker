/** Static research fixture, not a negotiated carrier quote or permission to charge. */
export const tariff = {
 version: 'usps-ga-commercial-2026-10-04-research-v1',
 source: 'https://pe.usps.com/text/dmm300/Notice123.htm',
 zoneSource: 'https://postcalc.usps.com/ZoneCharts/',
 effectiveAt: '2026-10-04T00:00:00Z', checkedAt: '2026-10-26T21:00:00Z',
 // Conservative research review deadline, not a claim that USPS tariff ends then.
 expiresAt: '2026-10-27T13:00:00Z', originZip: '61115', dimDivisor:139,
 zones: {'60601':2,'10001':5,'90012':7} as Record<string,number>,
 // Weight pounds => zone2, zone5, zone7, USD cents. Current holiday tariff included.
 rates: [
 [808,929,1053],[848,1050,1255],[906,1212,1491],[999,1389,1724],
 [1041,1453,1817],[1059,1533,1936],[1067,1595,2028],[1092,1654,2113],
 [1190,1716,2206],[1291,1781,2302],[1399,1987,2543],[1490,2061,2653],
 [1553,2137,2762],[1612,2213,2874],[1658,2290,2986],[1696,2364,3097],
 [1734,2426,3186],[1751,2491,3284],[1787,2554,3382],[1811,2668,3642],
 [2059,2788,3971],[2227,3120,4608],[2421,3580,5389]
 ],
} as const;
export interface RateProvider {version:string; rate(weightLb:number,zone:number):number|null}
export const fixtureProvider:RateProvider={version:tariff.version,rate(weight,zone){const column=[2,5,7].indexOf(zone);return Number.isInteger(weight)&&column>=0?tariff.rates[weight-1]?.[column]??null:null;}};
export const packingVersion='estimated-aluminum-packing-2026-10-26-v1';
export const profiles:Record<string,{dimensions:[number,number,number];capacity:number;unitLb:number;tareLb:number}>={
 '18-inch-square-tacker':{dimensions:[20,20,4],capacity:25,unitLb:.7667136,tareLb:3},
 '12-inch-circle-tacker':{dimensions:[14,14,5],capacity:50,unitLb:.2458,tareLb:2},
 '9x17-can-tacker':{dimensions:[20,12,5],capacity:25,unitLb:.372708,tareLb:2.5},
 // 18in round: parent research used aluminum density.0975lb/in3; measured weight still required.
 '18-inch-circle-tacker':{dimensions:[20,20,6],capacity:25,unitLb:.59546145,tareLb:3},
};
