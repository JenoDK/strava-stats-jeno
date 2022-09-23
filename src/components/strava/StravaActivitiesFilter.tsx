import { Button, Checkbox, Container, FormControl, FormControlLabel, InputAdornment, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent, Switch, TextField } from "@mui/material";
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { LatLng } from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { Moment } from 'moment';
import { ChangeEvent, useEffect, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ActivityType } from "../../api/strava/enums";
import { IncludeOption } from "../../api/strava/enums/include-choice";

export interface PositionFilter {
    position: LatLng;
    radius: number;
}

export interface ActivitiesFilter {
    include_commutes: IncludeOption;
    include_private: IncludeOption;
    include_virtual: IncludeOption;
    title_text: string;
    types?: ActivityType[];
    before?: Moment;
    after?: Moment;
    position?: PositionFilter;
}

export const defaultFilter: ActivitiesFilter = {
    include_commutes: IncludeOption.INCLUDE,
    include_private: IncludeOption.INCLUDE,
    include_virtual: IncludeOption.INCLUDE,
    title_text: "",
}

interface StravaActivitiesFilterProps {
    onFilterChange: (event: ChangeEvent) => void;
    onSportTypeChange: (sportTypes: ActivityType[]) => void;
    onIncludePrivateActivitiesChanged: (includePrivate: IncludeOption) => void;
    onIncludeCommuteActivitiesChanged: (includecommute: IncludeOption) => void;
    onIncludeVirtualRideChanged: (includeVirtual: IncludeOption) => void;
    onPositionFilterChanged: (position?: PositionFilter) => void;
    onBeforeChanged: (value?: Moment) => void;
    onAfterChanged: (value?: Moment) => void;
    onFilterReset: () => void;
    defaultValues: ActivitiesFilter;
}

const names: string[] = Object.values(ActivityType);
const includeOptions: string[] = Object.values(IncludeOption);
const defaultCenter = new LatLng(51.50, -0.11)
const defaultSportTypes = [ActivityType.AllSportTypes];
const defaultUseMapFilter = true;
const defaultRadius = 5000;
const defaultAfter = null;
const defaultBefore = null;

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

export default function StravaActivitiesFilter(props: StravaActivitiesFilterProps) {

    const [sportType, setSportType] = useState<string[]>(defaultSportTypes);
    const [title, setTitle] = useState<string>("");
    const [includePrivate, setIncludePrivate] = useState<string>(defaultFilter.include_private);
    const [includeCommute, setIncludeCommute] = useState<string>(defaultFilter.include_commutes);
    const [includeVirtual, setIncludeVirtual] = useState<string>(defaultFilter.include_virtual);
    const [position, setPosition] = useState(defaultCenter);
    const [radius, setRadius] = useState(defaultRadius);
    const [useMapFilter, setUseMapFilter] = useState(defaultUseMapFilter);
    const [after, setAfter] = useState<Moment | null>(defaultAfter);
    const [before, setBefore] = useState<Moment | null>(defaultBefore);

    const handleSportTypeChange = (event: SelectChangeEvent<typeof sportType>) => {
        let value = event.target.value;
        setSportType(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleVirtualRideChange = (event: SelectChangeEvent<typeof includeVirtual>) => {
        setIncludeVirtual(event.target.value);
    };

    const handlePrivateActivitiesChange = (event: SelectChangeEvent<typeof includePrivate>) => {
        setIncludePrivate(event.target.value);
    };

    const handleCommuteChange = (event: SelectChangeEvent<typeof includeCommute>) => {
        setIncludeCommute(event.target.value);
    };

    useEffect(() => {
        props.onSportTypeChange(sportType.map(t => t as ActivityType));
    }, [sportType]);

    useEffect(() => {
        props.onAfterChanged(after ? after : undefined);
    }, [after]);

    useEffect(() => {
        props.onBeforeChanged(before ? before : undefined);
    }, [before]);

    useEffect(() => {
        props.onIncludeVirtualRideChanged(includeVirtual as IncludeOption);
    }, [includeVirtual]);

    useEffect(() => {
        props.onIncludePrivateActivitiesChanged(includePrivate as IncludeOption);
    }, [includePrivate]);

    useEffect(() => {
        props.onIncludeCommuteActivitiesChanged(includeCommute as IncludeOption);
    }, [includeCommute]);

    useEffect(() => {
        if (!useMapFilter) {
            props.onPositionFilterChanged(undefined);
        } else {
            props.onPositionFilterChanged({
                position: position,
                radius: radius
            });
        }
    }, [useMapFilter]);

    useEffect(() => {
        props.onPositionFilterChanged({
            position: position,
            radius: radius
        });
    }, [radius, position]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            let pos = new LatLng(position.coords.latitude, position.coords.longitude);
            setPosition(pos);
        });
    }, [])

    function CenterOnStartChanged(props: any) {
        const map = useMap();
        map.setView(props.position);
        return null
    }

    function DraggableMarker() {
        const map = useMapEvents({
            click: (event) => {
                setPosition(event.latlng);
            },
        });

        return (
            <Marker
                draggable={true}
                eventHandlers={{
                    dragend: (event) => {
                        setPosition(event.target._latlng);
                    }
                }}
                position={position}
                autoPan={true}
            />
        )
    }

    const SearchField = () => {
        const provider = new OpenStreetMapProvider();

        // @ts-ignore
        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            showMarker: false,
        });

        const map = useMap();
        useEffect(() => {
            map.addControl(searchControl);
            return () => { map.removeControl(searchControl) };
        }, []);

        return null;
    };

    function onResetFilters() {
        props.onFilterReset();
        setSportType(defaultSportTypes);
        setUseMapFilter(defaultUseMapFilter);
        setRadius(defaultRadius);
        setAfter(defaultAfter);
        setBefore(defaultBefore);
        setIncludeVirtual(props.defaultValues.include_virtual);
        setIncludePrivate(props.defaultValues.include_private);
        setIncludeCommute(props.defaultValues.include_commutes);
        setTitle(props.defaultValues.title_text);
    }

    return (
        <Container maxWidth="lg" disableGutters>
            <Button
                variant="contained"
                onClick={onResetFilters}>
                Reset filters
            </Button>
            <FormControl sx={{ m: 1, width: 300 }}>
                <InputLabel id="demo-multiple-name-label">Private activities</InputLabel>
                <Select
                    id="private"
                    value={includePrivate}
                    onChange={handlePrivateActivitiesChange}
                    input={<OutlinedInput label="Private activities" />}
                    MenuProps={MenuProps}
                >
                    {includeOptions.map((option) => (
                        <MenuItem
                            key={option}
                            value={option}
                        >
                            <ListItemText primary={`${option} private activities`} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl sx={{ m: 1, width: 300 }}>
                <InputLabel id="demo-multiple-name-label">Commute activities</InputLabel>
                <Select
                    id="commute"
                    value={includeCommute}
                    onChange={handleCommuteChange}
                    input={<OutlinedInput label="Commute activities" />}
                    MenuProps={MenuProps}
                >
                    {includeOptions.map((option) => (
                        <MenuItem
                            key={option}
                            value={option}
                        >
                            <ListItemText primary={`${option} commute activities`} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl sx={{ m: 1, width: 300 }}>
                <InputLabel id="demo-multiple-name-label">Virtual rides</InputLabel>
                <Select
                    id="virtual"
                    value={includeVirtual}
                    onChange={handleVirtualRideChange}
                    input={<OutlinedInput label="Virtual rides" />}
                    MenuProps={MenuProps}
                >
                    {includeOptions.map((option) => (
                        <MenuItem
                            key={option}
                            value={option}
                        >
                            <ListItemText primary={`${option} virtual activities`} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                id="title_text"
                label="Title contains"
                value={title}
                onChange={(event) => {
                    setTitle(event.target.value);
                    props.onFilterChange(event);
                }}
            />
            <FormControl sx={{ m: 1, width: 300 }}>
                <InputLabel id="sport-type-label">Sport</InputLabel>
                <Select
                    id="type"
                    multiple
                    value={sportType}
                    onChange={handleSportTypeChange}
                    input={<OutlinedInput label="Sport" />}
                    renderValue={(selected) => selected.join(', ')}
                    MenuProps={MenuProps}
                >
                    {names.map((name) => (
                        <MenuItem key={name} value={name}>
                            <Checkbox checked={sportType.indexOf(name) > -1} />
                            <ListItemText primary={name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                    label="After"
                    value={after}
                    onChange={(value) => setAfter(value)}
                    renderInput={(params) => <TextField {...params} />}
                />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                    label="Before"
                    value={before}
                    onChange={(value) => setBefore(value)}
                    renderInput={(params) => <TextField {...params} />}
                />
            </LocalizationProvider>
            <TextField
                label="Radius around marker"
                defaultValue={radius}
                sx={{ m: 1, width: '25ch' }}
                InputProps={{
                    endAdornment: <InputAdornment position="end">m</InputAdornment>,
                }}
                onChange={(event) => {
                    setRadius(Number(event.currentTarget.value));
                }}
                variant="filled"
            />
            <FormControlLabel control={
                <Switch
                    checked={useMapFilter}
                    onChange={(event, value) => setUseMapFilter(value)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
            } label="Use map filter" />
            {useMapFilter ?
                <MapContainer style={{ height: "500px" }} center={position} zoom={13} >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker />
                    <Circle
                        center={position}
                        pathOptions={{ fillColor: 'blue' }}
                        radius={radius}
                        stroke={false}
                    />
                    <CenterOnStartChanged position={position} />
                    <SearchField />
                </MapContainer>
                :
                <div></div>}
        </Container>
    );

}