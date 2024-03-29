import { Box, Paper, Typography } from "@mui/material";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Route, useNavigate } from "react-router-dom";

export const ProtectedRoute = (props) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const checkUserToken = useCallback(() => {
    const userToken = localStorage.getItem("token");
    if (!userToken || userToken === "undefined") {
      setIsLoggedIn(false);
      return navigate("/login");
    }
    setIsLoggedIn(true);
  }, [navigate]);

  useEffect(() => {
    checkUserToken();
  }, [checkUserToken]);
  return <React.Fragment>{isLoggedIn ? props.children : null}</React.Fragment>;
};

export const PublicRoute = (props) => {
  const navigate = useNavigate();
  const [accessPublic, setAccessPublic] = useState(false);

  const checkFolderPublic = useCallback(() => {
    const path = window.location.pathname;
    const pathSplit = path.split("/");
    if (pathSplit.length !== 4) {
      navigate("/");
    }
    // path.split("/")[2] may contain %2F which is /
    // replace %2F with /
    const username = path.split("/")[2];
    const bucket_name = "datadrive";
    const folder = path.split("/")[3].replace("%2F", "/").replace("%20", " ");
    const folderId = path.split("/")[2] + "/" + folder + "/";
    console.log("folderId: " + folderId);
    const requestBody = {
      user_id: username,
      file_name: folderId,
      bucket_name: bucket_name,
    };
    console.log(requestBody);
    axios
      .post("http://localhost:8000/is_public", requestBody)
      .then((res) => {
        console.log(res.data);
        if (res.data.is_public === 1 && res.data.isDir === true) {
          console.log("Public");
          props.setRootFolderId(folderId);
          setAccessPublic(true);
        } else {
          console.log("Not Public");
          setAccessPublic(false);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [navigate]);

  useEffect(() => {
    checkFolderPublic();
  }, [checkFolderPublic]);

  return (
    <React.Fragment>
      {accessPublic ? (
        props.children
      ) : (
        <Box>
          <Paper
            elevation={3}
            sx={{ padding: 2, margin: 2, textAlign: "center" }}
          >
            <Typography variant="h4" component="div" gutterBottom>
              404
            </Typography>
            <Typography variant="body1" component="div" gutterBottom>
              Resource Not Found
            </Typography>
            <Typography variant="body1" component="div" gutterBottom>
              Either the resource is not public or it doesn't exist.
            </Typography>
          </Paper>
        </Box>
      )}
    </React.Fragment>
  );
};
