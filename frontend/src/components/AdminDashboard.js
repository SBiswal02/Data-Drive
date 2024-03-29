import React, { useState, useEffect } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Box } from "@mui/material";
import { CircularProgressbar } from "react-circular-progressbar"; // admin control center for the web browser
import HomeIcon from "@mui/icons-material/Home";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import { Grid } from "@mui/material";
import axios from "axios";
import { Card, CardContent, Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
  Paper,
  IconButton,
} from "@mui/material";
import { TextField, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Edit } from "@mui/icons-material";
import { TablePagination } from "@mui/material";
import { Chart as ChartJS, registerables } from "chart.js";
ChartJS.register(...registerables);
export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentBucket, setCurrentBucket] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [defaultStorageLimit, setDefaultStorageLimit] = useState(50);
  const [currentStorage, setCurrentStorage] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentBucketSize, setCurrentBucketSize] = useState(50);
  const [rows, setUsers] = useState([]);
  const [page, setPage] = React.useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [bucketNameForm, setBucketNameForm] = useState("");
  const [bucketStats, setBucketStats] = useState({});
  const [visibleBuckets, setVisibleBuckets] = useState([]);

  const data = {
    labels: visibleBuckets.map(([bucketName, stats]) => bucketName),
    datasets: [
      {
        label: "Storage Used",
        data: visibleBuckets.map(([bucketName, stats]) => stats.storage_used),
        backgroundColor: "rgba(75,192,192,0.6)",
      },
      {
        label: "Storage Limit",
        data: visibleBuckets.map(([bucketName, stats]) => stats.storage_limit),
        backgroundColor: "rgba(255,99,132,0.6)",
      },
    ],
  };
  const options = {
    indexAxis: "y",
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Bucket Storage",
      },
    },
  };
  useEffect(() => {
    axios.get("http://localhost:8000/get_storage_used_stats").then((res) => {
      console.log(res.data.data);
      setBucketStats(res.data.data);
    });
  }, []);
  useEffect(() => {
    // Convert the bucketStats object to an array and take the first 5 elements
    setVisibleBuckets(Object.entries(bucketStats).slice(0, 5));
  }, [bucketStats]);
  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:8000/get_users");
        setUsers(res.data.users);
        setTotalUsers(res.data.users.length);
        console.log(res.data.users);
      } catch (err) {
        setError(err);
      }
      setLoading(false);
    };
    try {
      axios.get("http://localhost:8000/get_bucket").then((res) => {
        console.log(res);
        setCurrentBucket(res.data.bucket_name);
        setBucketNameForm(res.data.bucket_name);
      });
    } catch (err) {
      setError(err);
    }
    try {
      axios.get("http://localhost:8000/current_bucket_storage").then((res) => {
        console.log(res.data);
        const storage_used = res.data.data.storage_used;
        const bucket_size = res.data.data.storage_limit;
        const percentage = (storage_used / bucket_size) * 100;
        setCurrentStorage(storage_used);
        setCurrentLimit(bucket_size);
        setCurrentBucketSize(percentage.toFixed(2));
      });
    } catch (err) {
      setError(err);
    }
    try {
      axios
        .get("http://localhost:8000/get_bucket_storage_limit")
        .then((res) => {
          console.log(res.data.data.default_storage_limit);
          setDefaultStorageLimit(res.data.data.default_storage_limit);
        });
    } catch (err) {
      setError(err);
    }
    setLoading(false);
    getUsers();
  }, []);

  function handleBucketChange(newBucketName) {
    setBucketNameForm(newBucketName);
  }
  function handleUpdateBucket() {
    setCurrentStorage(0);
    axios
      .post("http://localhost:8000/update_bucket", {
        bucket_name: bucketNameForm,
      })
      .then((res) => {
        console.log(res);
        window.location.reload();
      })
      .catch((err) => {
        console.log(err);
      });
  }
  function handleUpdateStorageLimit() {
    console.log(defaultStorageLimit);
    axios.post("http://localhost:8000/update_bucket_storage_limit", {
      storage_limit: defaultStorageLimit,
    });
    // window.location.reload();
  }
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenModal = (userId, oldLimit) => {
    setSelectedUserId(userId);
    setNewLimit(oldLimit);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleConfirmModal = () => {
    handleStorageLimitChange(selectedUserId, newLimit);
    setOpenModal(false);
  };

  const handleDelete = (userId) => {
    // Implement the logic to delete the user
    console.log(`Deleting user ${userId}`);
  };

  const handleStorageLimitChange = (userId, newLimit) => {
    axios
      .post("http://localhost:8000/update_storage_limit", {
        user_id: userId,
        storage_limit: newLimit,
      })
      .then((res) => {
        console.log(res);
        console.log(res.data);
        if (res.data.status === 1) {
          const newUsers = rows.map((user) => {
            if (user.user_id === userId) {
              return {
                ...user,
                storage_limit: newLimit,
              };
            }
            return user;
          });
          setUsers(newUsers);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <Box sx={{ display: "flex", flexGrow: 1, maxWidth: "xs" }}>
      <Box>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        >
          <Menu iconShape="circle">
            {collapsed ? (
              <MenuItem
                icon={<KeyboardDoubleArrowRightIcon />}
                onClick={() => setCollapsed(!collapsed)}
              ></MenuItem>
            ) : (
              <MenuItem
                suffix={<KeyboardDoubleArrowLeftIcon />}
                onClick={() => setCollapsed(!collapsed)}
              >
                <div
                  style={{
                    padding: "9px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    fontSize: 15,
                    letterSpacing: "1px",
                  }}
                >
                  Data Drive
                </div>
              </MenuItem>
            )}
            <MenuItem icon={<HomeIcon />}> Admin Dashboard </MenuItem>
          </Menu>
        </Sidebar>
      </Box>
      <Box sx={{ width: "100%", p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: 300, width: 300 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {currentBucket}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  {currentStorage} used of {currentLimit} MB
                </Typography>
                <div style={{ width: 200, height: 200 }}>
                  <CircularProgressbar
                    value={currentBucketSize}
                    text={`${currentBucketSize}%`}
                    styles={{
                      path: {
                        stroke: `rgba(62, 152, 199, ${100 / 100})`,
                        strokeLinecap: "butt",
                        transition: "stroke-dashoffset 0.5s ease 0s",
                        transform: "rotate(0.25turn)",
                        transformOrigin: "center center",
                      },
                      trail: {
                        stroke: "#d6d6d6",
                        strokeLinecap: "butt",
                        transform: "rotate(-135deg)",
                        transformOrigin: "center center",
                      },
                      text: {
                        fill: "#3E98C7",
                        fontSize: "16px",
                      },
                      background: {
                        fill: "#3e98c7",
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: 300, width: 300 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  Total Users
                </Typography>
                <Typography variant="h2">{totalUsers}</Typography>
              </CardContent>{" "}
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: 300, width: 300 }}>
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="h5" component="div">
                    Current Bucket
                  </Typography>
                  <TextField
                    id="outlined-basic"
                    variant="outlined"
                    value={bucketNameForm}
                    onChange={
                      (e) => handleBucketChange(e.target.value)
                      // console.log(e.target.value)
                    }
                  />
                  <Button variant="contained" onClick={handleUpdateBucket}>
                    Change Bucket
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: 300, width: 300 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: 2,
                }}
              >
                <Typography variant="h5" component="div">
                  Storage Limit (in MB)
                </Typography>
                <TextField
                  id="outlined-basic"
                  variant="outlined"
                  value={defaultStorageLimit}
                  onChange={(e) => setDefaultStorageLimit(e.target.value)}
                />
                <Button variant="contained" onClick={handleUpdateStorageLimit}>
                  Edit Limit
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "100%",
            mt: 2,
          }}
        >
          <TableContainer
            component={Paper}
            sx={{ flexBasis: "45%", overflowX: "auto" }}
          >
            <Table sx={{ minWidth: 100 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell align="right">Bucket Name</TableCell>
                  <TableCell align="right">Storage Used</TableCell>
                  <TableCell align="right">Storage Limit</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell
                        style={{ width: 100 }}
                        component="th"
                        scope="row"
                      >
                        {row.user_id}
                      </TableCell>
                      <TableCell align="right">{row.bucket_name}</TableCell>
                      <TableCell align="right">{row.storage_used} MB</TableCell>
                      <TableCell align="right">
                        {row.storage_limit} MB
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="delete"
                          onClick={() => handleDelete(row.user_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleOpenModal(row.user_id, row.storage_limit)
                          }
                          aria-label="Change Limit"
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
          <Box sx={{ flexBasis: "45%", overflowX: "auto", ml: 2 }}>
            <Bar data={data} options={options} />
          </Box>
        </Box>{" "}
      </Box>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="300px"
            padding="20px"
            backgroundColor="#fff"
            borderRadius="4px"
          >
            <TextField
              label="New Storage Limit"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <Button variant="contained" onClick={handleConfirmModal}>
              OK
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
