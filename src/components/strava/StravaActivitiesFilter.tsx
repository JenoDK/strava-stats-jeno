import { Checkbox, Container, FormControl, FormControlLabel, InputAdornment, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent, TextField } from "@mui/material";
import { LatLng } from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { ChangeEvent, useEffect, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ActivityType } from "../../api/strava/enums";

export interface PositionFilter {
    position: LatLng;
    radius: number;
}

export interface ActivitiesFilter {
    include_commutes: boolean;
    include_private: boolean;
    title_text: string;
    types?: ActivityType[];
    position?: PositionFilter;
}

export const defaultFilter: ActivitiesFilter = {
    include_commutes: true,
    include_private: true,
    title_text: "",
}

interface StravaActivitiesFilterProps {
    onFilterChange: (event: ChangeEvent) => void;
    onSportTypeChange: (sportTypes: ActivityType[]) => void;
    onPositionFilterChanged: (position: PositionFilter) => void;
    defaultValues: ActivitiesFilter;
}

const names: string[] = Object.values(ActivityType);
const defaultCenter = new LatLng(51.50, -0.11)

export default function StravaActivitiesFilter(props: StravaActivitiesFilterProps) {

    const [sportType, setSportType] = useState<string[]>([ActivityType.AllSportTypes]);
    const [position, setPosition] = useState(defaultCenter);
    const [radius, setRadius] = useState(5000);

    const handleSportTypeChange = (event: SelectChangeEvent<typeof sportType>) => {
        let value = event.target.value;
        setSportType(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    useEffect(() => {
        props.onSportTypeChange(sportType.map(t => t as ActivityType));
    }, [sportType]);

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

    return (
        <Container maxWidth="lg" disableGutters>
            <FormControlLabel control={
                <Checkbox
                    defaultChecked={props.defaultValues.include_commutes}
                    id="include_commutes"
                    onChange={props.onFilterChange}
                />
            } label="Include commutes" />
            <TextField
                id="title_text"
                label="Title contains"
                onChange={props.onFilterChange}
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
                >
                    {names.map((name) => (
                        <MenuItem key={name} value={name}>
                            <Checkbox checked={sportType.indexOf(name) > -1} />
                            <ListItemText primary={name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
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
        </Container>
    );

}