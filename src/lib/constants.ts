export const ASSET_TYPES = {
    CAR: "Car",
    HOUSE: "House",
    UTILITY: "Utility",
} as const;

export type AssetType = (typeof ASSET_TYPES)[keyof typeof ASSET_TYPES];

export const TRACKING_METHODS = {
    MILEAGE: "Mileage",
    HOURS: "Hours",
    DATE: "DateOnly",
} as const;

export type TrackingMethod = (typeof TRACKING_METHODS)[keyof typeof TRACKING_METHODS];

export interface AssetDetails {
    // Car
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    engine?: string;
    transmission?: string;

    // House
    address?: string;
    yearBuilt?: number;
    squareFootage?: number;

    // General/Utility
    manufacturer?: string;
    serialNumber?: string;
    purchasePrice?: number;
    purchaseDate?: string;
}
