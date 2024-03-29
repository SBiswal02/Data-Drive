import React, { useState } from "react";
import { Card, Typography, Button } from "@mui/material";
import { Grid, TextField } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
/*
@description:
  This component is used to display the login page
@props:
  setToken: function to set the token in the local storage
*/
function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  /*
  @description:
    Handles the login button click event
  */
  const handleLogin = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:8000/login", {
        email: username,
        password: password,
      })
      .then((res) => {
        console.log(res);
        console.log(res.data.access_token);
        const x = jwtDecode(res.data.access_token);
        console.log(x);
        if (res.data.status === 1) {
          if (res.data.admin === 1) {
            setToken(res.data.access_token);
            navigate("/admin");
          } else {
            setToken(res.data.access_token);
            navigate("/");
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <Grid
      container
      alignItems="center"
      justifyContent="right"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        backgroundImage:
          "url('https://media.giphy.com/media/7AtHoQ9XWbpwLRxs0t/giphy.gif')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Grid item xs={12} sm={6} md={4}>
        <Card
          sx={{
            maxWidth: 445,
            padding: 3,
            boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .3)",
          }}
        >
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Login
            </Typography>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              sx={{ marginBottom: 2 }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ marginBottom: 2 }}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleLogin}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default Login;
