/** Owner-confirmed October 27, 2026. No carrier transmission. */
export const confirmedShippingOrigin = {
 streetLines:['7817 Burden Road'],city:'Machesney Park',state:'IL',postalCode:'61115',country:'US',
} as const;
export const confirmedCarrierPickup = {
 ups:{atOrigin:true,apiPickupCode:null,accountContractVerified:false},
 fedex:{atOrigin:true,apiPickupCode:null,accountContractVerified:false},
} as const;
// Both carriers collect at Burden Road, per owner. This does not establish a
// daily/regular contract, API code, surcharge treatment or service entitlement.
// Reviewed account configuration remains required; no carrier is enabled.
