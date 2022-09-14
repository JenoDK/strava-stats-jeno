import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import { Box, CircularProgress, CssBaseline, IconButton, Link, TableFooter, TablePagination, useTheme } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { CompleteAthlete, SummaryActivity } from '../../api/strava/models';
import { Strava } from '../../api/strava/StravaApi';

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
    const [activities, setActivities] = useState<Map<number, SummaryActivity[]>>(new Map<number, SummaryActivity[]>());

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        if (activities.has(newPage)) {
            setPage(newPage);
        } else {
            setPage(newPage);
            loadActivities(newPage, rowsPerPage);
        }
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        let newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0);
        setActivities(new Map<number, SummaryActivity[]>());
        loadActivities(0, newRowsPerPage);
    };

    async function loadActivities(page: number, pageSize: number) {
        setLoading(true);
        props.strava.getLoggedInAthleteActivities(undefined, undefined, page + 1, pageSize)
            .then(function (a) {
                setActivities(current => {
                    current.set(page, a);
                    return current;
                });
                setLoading(false);
            })
            .catch(function (error: AxiosError) {
                console.log(error);
                setLoading(false);
            });
    }

    useEffect(() => {
        loadActivities(0, rowsPerPage);
    }, [])

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell align="right">Distance</TableCell>
                        <TableCell align="right">Kudos</TableCell>
                        <TableCell align="right">Link</TableCell>
                    </TableRow>
                </TableHead>
                {loading ?
                    <CircularProgress sx={{ marginLeft: "15px", marginTop: "15px" }} />
                    :
                    <TableBody>
                        {(rowsPerPage > 0
                            ? (activities.has(page) ? activities.get(page)! : [])
                            : []
                        ).map((activity) => (
                            <TableRow
                                key={activity.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {activity.name}
                                </TableCell>
                                <TableCell align="right">{activity.distance}</TableCell>
                                <TableCell align="right">{activity.kudos_count}</TableCell>
                                <TableCell align="right"><Link href={`https://www.strava.com/activities/${activity.id}`} target="_blank" rel="noreferrer" >Link</Link></TableCell>
                            </TableRow>
                        )
                        )}
                    </TableBody>
                }
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                            colSpan={3}
                            count={props.complete_athlete.athlete_stats.all_ride_totals.count}
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
    );
}
