// USA
import USMap from '../usa/components/USMap';
import { statesList as usStatesList } from '../usa/data/states';
import { usDimensionsMap, usDimensions, getMockUSData } from '../usa/data/usMockData';

// Canada
import CanMap from '../can/components/CanMap';
import { canProvincesList } from '../can/data/canProvinces';
import { canDimensionsMap, canDimensions, getMockCanData } from '../can/data/canMockData';

// Australia
import AusMap from '../aus/components/AusMap';
import { ausStatesList } from '../aus/data/ausStates';
import { ausDimensionsMap, ausDimensions, getMockAusData } from '../aus/data/ausMockData';

export const countryRegistry = {
    usa: {
        id: 'usa',
        name: 'United States',
        iso2: 'US',
        mapComponent: USMap,
        regions: usStatesList,
        dimensionsMap: usDimensionsMap,
        dimensions: usDimensions,
        mockDataFn: getMockUSData,
        regionCodePrefix: 'us-', // for flagcdn
        regionKeyField: 'name'
    },
    can: {
        id: 'can',
        name: 'Canada',
        iso2: 'CA',
        mapComponent: CanMap,
        regions: canProvincesList,
        dimensionsMap: canDimensionsMap,
        dimensions: canDimensions,
        mockDataFn: getMockCanData,
        regionCodePrefix: 'ca-', // for flagcdn
        regionKeyField: 'name'
    },
    aus: {
        id: 'aus',
        name: 'Australia',
        iso2: 'AU',
        mapComponent: AusMap,
        regions: ausStatesList,
        dimensionsMap: ausDimensionsMap,
        dimensions: ausDimensions,
        mockDataFn: getMockAusData,
        regionCodePrefix: 'au-', // for flagcdn
        regionKeyField: 'name'
    }
};
