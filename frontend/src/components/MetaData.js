import { Box, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import CloseIcon from "@mui/icons-material/Close";
import { extractFiletypeIcon } from "../utils/extract-file-type";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

/*
@description: 
  This component is used to display the metadata of a file
@props:
  showMetaData: boolean value to show or hide the metadata pane
  setShowMetaData: function to set the value of showMetaData
  metaFileData: object containing the metadata of the file
*/
export default function MetaDataPane({
  showMetaData,
  setShowMetaData,
  metaFileData,
}) {
  const [listUsers, setListUsers] = useState([]); // list of users with whom the file is shared

  // get the list of users with whom the file is shared
  useEffect(() => {
    const data = jwtDecode(localStorage.getItem("token"));
    const sender = data["username"];
    const bucket_name = data["bucket_name"];
    const requestBody = {
      user_id: sender,
      file_name: metaFileData.id,
      bucket_name: bucket_name,
    };
    axios
      .post("http://localhost:8000/get_shared_file_data", requestBody)
      .then((response) => {
        console.log(response.data);
        const users = response.data.users.map((user) => user.reciever_id);
        setListUsers(users);
      });
  }, [metaFileData]);

  return (
    <>
      {showMetaData && (
        <Sidebar
          collapsed={!showMetaData}
          onToggle={() => setShowMetaData(!showMetaData)}
          width="400px"
        >
          <Menu iconShape="circle">
            <MenuItem
              suffix={<CloseIcon />}
              onClick={() => setShowMetaData(!showMetaData)}
              icon={extractFiletypeIcon(metaFileData.name)}
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
                {metaFileData.name}
              </div>
            </MenuItem>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                File details
              </Typography>
              <Box>
                <Typography variant="body1" gutterBottom>
                  Name:
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {metaFileData.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" gutterBottom>
                  Modified Date:
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {metaFileData.modDate}
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom>
                Metadata:
              </Typography>
              {metaFileData.metadata && (
                <Box sx={{ paddingLeft: 2 }}>
                  {Object.entries(metaFileData.metadata).map(([key, value]) => (
                    <Box key={key}>
                      <Typography variant="body1">{key}:</Typography>
                      <Typography variant="body2">{value}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              <Typography variant="body1" gutterBottom>
                Shared with:
              </Typography>
              {listUsers && (
                <Box sx={{ paddingLeft: 2 }}>
                  {listUsers.map((user) => (
                    <Typography key={user} variant="body2">
                      {user}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Menu>
        </Sidebar>
      )}
    </>
  );
}
