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
        getFlagUrl: (code) => `https://flagcdn.com/w40/us-${code.toLowerCase()}.png`,
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
        getFlagUrl: (code) => `https://flagcdn.com/w40/ca.png`,
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
        getFlagUrl: (code) => `https://flagcdn.com/w40/au.png`,
        regionKeyField: 'name'
    }
};
