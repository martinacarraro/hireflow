# Attribution for the local city autocomplete

This file contains a local copy of selected fields (city name, country, and first-level region) from the [world-cities dataset](https://github.com/datasets/world-cities), based on GeoNames' cities15000 list.

- GeoNames city data: Creative Commons Attribution 4.0 International (CC BY 4.0). Source: https://www.geonames.org/
- The upstream dataset uses country names from pycountry, licensed under LGPL-2.1, which includes iso-codes data.
- Upstream source: https://github.com/datasets/world-cities
- Changes made here: retained the city, country, and region fields; removed duplicate city-country pairs; bundled the data locally for offline suggestions.
- The upstream dataset includes cities with more than 15,000 inhabitants, plus capitals and seats of government. It does not claim to list every small locality.

GeoNames data is provided “as is” without warranty of accuracy, timeliness, or completeness.
