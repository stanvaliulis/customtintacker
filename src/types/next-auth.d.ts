import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    accountVersion?: number;
    role?: string;
    companyName?: string;
    asiNumber?: string;
    sageNumber?: string;
    ppaiNumber?: string;
    discountTier?: number;
  }

  interface Session {
    user: User & {
      role?: string;
      companyName?: string;
      asiNumber?: string;
      sageNumber?: string;
      ppaiNumber?: string;
      discountTier?: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountVersion?: number;
    role?: string;
    companyName?: string;
    asiNumber?: string;
    sageNumber?: string;
    ppaiNumber?: string;
    discountTier?: number;
  }
}
