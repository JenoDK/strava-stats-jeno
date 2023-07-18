import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import {
    Box,
    CircularProgress,
    Container,
    IconButton,
    Link,
    TableFooter,
    TablePagination,
    Typography,
    useTheme
} from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {AxiosError} from 'axios';
import moment, {Moment} from 'moment';
import {ReactNode, useEffect, useReducer, useState} from 'react';
import {MapContainer, Polyline, TileLayer} from 'react-leaflet';
import {ActivityType} from '../../api/strava/enums';
import {CompleteAthlete, PolylineMap, SummaryActivity} from '../../api/strava/models';
import {Strava} from '../../api/strava/StravaApi';
import StravaActivitiesFilter, {ActivitiesFilter, defaultFilter, PositionFilter} from './StravaActivitiesFilter';
import StravaActivitiesSummary from './StravaActivitiesSummary';

import {decode} from 'google-polyline';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import {IncludeOption} from '../../api/strava/enums/include-choice';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TablePaginationActionsProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement>,
        newPage: number,
    ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
}

interface StravaActivitiesProps {
    strava: Strava,
    complete_athlete: CompleteAthlete
}

export default function StravaActivitiesTable(props: StravaActivitiesProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<SummaryActivity[]>([]);
    const [filters, setFilters] = useReducer((state: any, updates: any) => ({ ...state, ...updates }), defaultFilter);

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    async function loadActivities(actvts: SummaryActivity[], page: number) {
        setLoading(true);

        props.strava.getLoggedInAthleteActivities(undefined, undefined, page, 200)
            .then(function (a) {
                if (a.length > 0) {
                    actvts = actvts.concat(a);
                    page = page + 1;
                    loadActivities(actvts, page);
                } else {
                    setLoading(false);
                    setActivities(actvts);
                    localStorage.setItem("activities", JSON.stringify(actvts));
                }
            })
            .catch(function (error: AxiosError) {
                console.log(error);
                setLoading(false);
            });
    }

    useEffect(() => {
        const sessionActivities = localStorage.getItem("activities");
        if (sessionActivities) {
            setActivities(JSON.parse(sessionActivities));
        } else {
            var actvts: SummaryActivity[] = [];
            loadActivities(actvts, 1);
        }
    }, [])

    useEffect(() => {
        checkFilters(filters);
    }, [filters])

    function resetFilters() {
        setFilters(defaultFilter);
    }

    function filterChanged(event: React.ChangeEvent<any>) {
        if (event.currentTarget.id) {
            if (event.currentTarget.type === "checkbox") {
                setFilters({ [event.currentTarget.id]: event.currentTarget.checked })
            } else {
                setFilters({ [event.currentTarget.id]: event.currentTarget.value })
            }
        }
    }

    function includeVirtualChanged(includeOption: IncludeOption) {
        setFilters({ include_virtual: includeOption });
    }

    function includePrivateChanged(includeOption: IncludeOption) {
        setFilters({ include_private: includeOption });
    }

    function includeCommuteChanged(includeOption: IncludeOption) {
        setFilters({ include_commutes: includeOption });
    }

    function sportTypeChanged(sportTypes: ActivityType[]) {
        setFilters({ types: sportTypes })
    }

    function avgSpeedBetweenChanged(avgSpeedBetween: number[]) {
        setFilters({ avg_speed_between: avgSpeedBetween })
    }

    function minDistanceChanged(minDistance: number) {
        setFilters({ min_distance: minDistance })
    }

    function maxDistanceChanged(maxDistance: number) {
        setFilters({ max_distance: maxDistance })
    }

    function beforeChanged(value?: Moment) {
        if (value) {
            setFilters({ before: value.utc().startOf('day') });
        } else {
            setFilters({ before: undefined });
        }
    }

    function afterChanged(value?: Moment) {
        if (value) {
            setFilters({ after: value.utc().startOf('day') });
        } else {
            setFilters({ after: undefined });
        }
    }

    function positionFilterChanged(position?: PositionFilter) {
        setFilters({ position: position });
    }

    const checkFilters = (filters: ActivitiesFilter) => {
        const sessionActivities = localStorage.getItem("activities");
        if (sessionActivities) {
            let actvts: SummaryActivity[] = JSON.parse(sessionActivities);
            let filteredActivities = actvts.filter(activity => {
                var should_include = true;
                if (filters.include_commutes) {
                    switch (filters.include_commutes) {
                        case IncludeOption.EXCLUDE:
                            should_include = should_include && !activity.commute;
                            break;
                        case IncludeOption.INCLUDE:
                            // No need to change should_include here
                            break;
                        case IncludeOption.ONLY:
                            should_include = should_include && activity.commute;
                            break;
                    }
                }
                if (filters.include_private) {
                    switch (filters.include_private) {
                        case IncludeOption.EXCLUDE:
                            should_include = should_include && !activity.private;
                            break;
                        case IncludeOption.INCLUDE:
                            // No need to change should_include here
                            break;
                        case IncludeOption.ONLY:
                            should_include = should_include && activity.private;
                            break;
                    }
                }
                if (filters.include_virtual) {
                    switch(filters.include_virtual) {
                        case IncludeOption.EXCLUDE:
                            should_include = should_include && activity.type != ActivityType.VirtualRide;
                            break;
                        case IncludeOption.INCLUDE:
                            // No need to change should_include here
                            break;
                        case IncludeOption.ONLY:
                            should_include = should_include && activity.type == ActivityType.VirtualRide;
                            break;
                    }
                }
                if (filters.title_text && !activity.name.toLowerCase().includes(filters.title_text.toLowerCase())) {
                    return false;
                }
                const activitySpeedInKmPerH = (activity.average_speed * 3.6)
                if (filters.min_avg_speed && activitySpeedInKmPerH < filters.min_avg_speed) {
                    return false;
                }
                if (filters.min_distance && activity.distance < (filters.min_distance * 1000)) {
                    return false;
                }
                if (filters.max_distance && activity.distance > (filters.max_distance * 1000)) {
                    return false;
                }
                if (filters.avg_speed_between) {
                    should_include = should_include && (filters.avg_speed_between[0] < activitySpeedInKmPerH && activitySpeedInKmPerH < filters.avg_speed_between[1]);
                }
                if (filters.before) {
                    should_include = should_include && moment(activity.start_date).isBefore(filters.before);
                }
                if (filters.after) {
                    should_include = should_include && moment(activity.start_date).isAfter(filters.after);
                }
                if (filters.types) {
                    // If no types were selected nothing will match
                    if (filters.types.length == 0) {
                        return false;
                    }
                    // only check if the types doesnt contain 'all sport types'
                    if (filters.types.indexOf(ActivityType.AllSportTypes) == -1) {
                        should_include = should_include && filters.types.indexOf(activity.type) > -1;
                    }
                }
                if (filters.position) {
                    if (activity.map) {
                        let coordinateIn5KmRadiusOfPosition = decode(activity.map.summary_polyline).find((latlng) => {
                            let distanceBetweenPoints = filters.position!.position.distanceTo({
                                lat: latlng[0],
                                lng: latlng[1]
                            });
                            return distanceBetweenPoints < filters.position!.radius;
                        });
                        should_include = should_include && coordinateIn5KmRadiusOfPosition != undefined;
                    } else {
                        should_include = false;
                    }
                }
                return should_include;
            });
            setActivities(filteredActivities);
            setPage(0);
        }
    };

    const limeOptions = { color: 'orange' }

    function getPolyline(map: PolylineMap): ReactNode {
        if (!map) {
            return null;
        }
        let decoded = decode(map.summary_polyline);
        if (decoded.length > 0) {
            var bounds = new L.LatLngBounds(decoded);
            var center = bounds.getCenter();
            return <MapContainer style={{ height: "200px" }} center={center} bounds={bounds} >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline pathOptions={limeOptions} positions={decoded} />
            </MapContainer>;
        } else {
            return null;
        }
    }

    const defaultActivityMapWidth = "30%";

    return (
        <Container maxWidth="lg" disableGutters>
            <StravaActivitiesSummary activities={activities} />
            <Container maxWidth="lg" disableGutters>
                <StravaActivitiesFilter 
                    defaultValues={defaultFilter} 
                    onFilterChange={filterChanged} 
                    onIncludeVirtualRideChanged={includeVirtualChanged}
                    onIncludePrivateActivitiesChanged={includePrivateChanged}
                    onIncludeCommuteActivitiesChanged={includeCommuteChanged}
                    onBeforeChanged={beforeChanged}
                    onAfterChanged={afterChanged}
                    onPositionFilterChanged={positionFilterChanged} 
                    onSportTypeChange={sportTypeChanged}
                    onAvgSpeedBetweenChanged={avgSpeedBetweenChanged}
                    onMinDistanceChanged={minDistanceChanged}
                    onMaxDistanceChanged={maxDistanceChanged}
                    onFilterReset={resetFilters} />
            </Container>
            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
                <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Avg speed (km/h)</TableCell>
                            <TableCell>Distance (km)</TableCell>
                            <TableCell>Elevation (m)</TableCell>
                            <TableCell>Kudos</TableCell>
                            <TableCell width={defaultActivityMapWidth} >Map</TableCell>
                        </TableRow>
                    </TableHead>
                    {loading ?
                        <Box sx={{
                            position: 'relative',
                            display: 'inline-flex',
                            marginTop: '15px',
                            marginLeft: '15px'
                        }}>
                            <CircularProgress sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }} {...props} />
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingLeft: '10px'
                                }}
                            >
                                <Typography>{`Fetching all activities`}</Typography>
                            </Box>
                        </Box>
                        :
                        <TableBody>
                            {(rowsPerPage > 0
                                ? activities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : activities
                            ).map((activity) => (
                                <TableRow
                                    key={activity.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell>
                                        <Link href={`https://www.strava.com/activities/${activity.id}`} target="_blank" rel="noreferrer" >{activity.name}</Link>
                                    </TableCell>
                                    <TableCell>{moment(activity.start_date).format("D/MM/YYYY HH:mm:ss")}</TableCell>
                                    <TableCell>{(activity.average_speed * 3.6).toFixed(2)} km/h</TableCell>
                                    <TableCell>{(activity.distance / 1000).toFixed(2)} km</TableCell>
                                    <TableCell>{activity.total_elevation_gain} meters</TableCell>
                                    <TableCell>{activity.kudos_count}</TableCell>
                                    <TableCell width={defaultActivityMapWidth}>
                                        {getPolyline(activity.map)}
                                    </TableCell>
                                </TableRow>
                            )
                            )}
                        </TableBody>
                    }
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                                colSpan={4}
                                count={activities.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                SelectProps={{
                                    inputProps: {
                                        'aria-label': 'rows per page',
                                    },
                                    native: true,
                                }}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                ActionsComponent={TablePaginationActions}
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
        </Container>
    );

}