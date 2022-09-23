import { Grid } from "@mui/material";
import { SummaryActivity } from "../../api/strava/models";

interface StravaActivitiesSummaryProps {
    activities: SummaryActivity[];
}

export default function StravaActivitiesSummary(props: StravaActivitiesSummaryProps) {

    function getTotalDistance(): string {
        const totalDistance = (props.activities.reduce((sum, activity) => sum + activity.distance, 0) / 1000).toFixed(2);
        return `Total distance: ${totalDistance}km`;
    }

    function getTotalElevation(): string {
        const totalElevation = props.activities.reduce((sum, activity) => sum + activity.total_elevation_gain, 0).toFixed(2);
        return `Total elevation gained: ${totalElevation}m`;
    }

    function getTotalActivities(): string {
        return `Total activities: ${props.activities.length}`;
    }

    function hoursSpent(): string {
        const totalMovingTimeInMinutes = (props.activities.reduce((sum, activity) => sum + activity.moving_time, 0) / 60);
        const inHours = Math.floor(totalMovingTimeInMinutes / 60).toFixed(0);
        const remainderInMin = (totalMovingTimeInMinutes % 60).toFixed(0);
        return `Total moving time: ${inHours}h${remainderInMin}m`;
    }

    function getSummaries(): string[] {
        return [getTotalActivities(), getTotalDistance(), getTotalElevation(), hoursSpent()]
    }

    return (
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
            {Array.from(getSummaries()).map((text, index) => (
                <Grid item xs={2} sm={4} md={4} key={index}>
                    {text}
                </Grid>
            ))}
        </Grid>
    );
}