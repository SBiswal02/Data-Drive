import { ChonkyIconName, defineFileAction } from "chonky";
// import { OpenFilesPayload } from 'chonky/lib/types/action-payloads.types';
import React, { useState, useEffect } from "react";
import { RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { Button } from "@mui/material";
import { InputLabel, Typography, Switch, Box } from "@mui/material";
import Modal from "@mui/material/Modal";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const style = (theme) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  width: "20%",
  display: "flex",
  flexDirection: "column",
  transform: "translate(-50%, -50%)",
  bgcolor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  p: theme.spacing(4),
});

/*
@description:
  This component is used to display generate Modal for Previewing the file
*/
export function ShareFilesModal(props) {
  const theme = useTheme();
  const themedStyle = style(theme);
  const [open, setOpen] = useState(props.open);
  const [users, setUsers] = useState([]); // users with existing access
  const [selectedUsers, setSelectedUsers] = useState([]); // new users to be shared with
  const [permission, setPermission] = useState("");
  const [publicAccess, setPublicAccess] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8000/get_users").then((response) => {
      const users = response.data.users.map((user) => user.user_id);
      setUsers(users);
    });
  }, []);

  const handleClose = () => {
    setOpen(false);
    props.setOpen(false);
    props.setSharedFile({});
  };

  /*
  @description:
    Handles the share button click event
  */
  function handleShare() {
    const data = jwtDecode(localStorage.getItem("token"));
    const sender = data["username"];
    const bucket_name = data["bucket_name"];
    if (publicAccess) {
      const requestBody = {
        sender_id: sender,
        bucket_name: bucket_name,
        file_name: props.sharedFile.id,
      };
      axios
        .post("http://localhost:8000/add_public_file", requestBody)
        .then(function (response) {
          console.log(response);
          handleClose();
        })
        .catch(function (error) {
          console.log(error);
        });
    } else {
      const requestBody = {
        sender_id: sender,
        reciever_id: selectedUsers,
        file_name: props.sharedFile.id,
        bucket_name: bucket_name,
        perms: permission === "read" ? "r" : "w",
      };
      axios
        .post("http://localhost:8000/add_shared_file", requestBody)
        .then(function (response) {
          console.log(response);
          handleClose();
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }

  return (
    <Box>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            width: 400,
            padding: 4,
            margin: "auto",
            ...themedStyle,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Share {`'` + props.sharedFile.name + `'`}
          </Typography>
          <Box sx={{ marginBottom: "20px" }}>
            <InputLabel id="select-permission-label">
              Manage Public Access
            </InputLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={publicAccess}
                  onChange={(event) => setPublicAccess(event.target.checked)}
                />
              }
            />
            <InputLabel id="select-permission-label">
              Select Permission
            </InputLabel>
            <RadioGroup
              aria-label="permissions"
              name="permissions"
              disabled={publicAccess}
              sx={{
                marginTop: "10px",
              }}
              value={permission}
              row
              onChange={(event) => setPermission(event.target.value)}
            >
              <FormControlLabel
                disabled={publicAccess}
                value="read"
                control={<Radio />}
                label="Read"
              />
              <FormControlLabel
                value="write"
                disabled={publicAccess}
                control={<Radio />}
                label="Write"
              />
            </RadioGroup>
          </Box>
          <Box
            sx={{
              marginBottom: "20px",
            }}
          >
            <InputLabel id="select-users-label">Add People</InputLabel>
            <Autocomplete
              sx={{
                marginTop: "10px",
              }}
              multiple={false}
              disabled={publicAccess}
              options={users}
              getOptionLabel={(option) => (option ? option : "")}
              value={selectedUsers}
              onChange={(event, newValue) => setSelectedUsers(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Add People"
                />
              )}
            />
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleShare}
              disabled={
                !publicAccess &&
                (selectedUsers.length === 0 || permission === "")
              }
            >
              Share
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

// custom action
export const ShareFiles = defineFileAction(
  {
    id: "share_files",
    button: {
      name: "Share",
      contextMenu: true,
      toolbar: true,
      group: "Actions",
      icon: ChonkyIconName.share,
      requiresSelection: true,
    },
  },
  ({ state }) => {
    const files = state.selectedFiles;
    return {
      files,
    };
    //
  }
);
