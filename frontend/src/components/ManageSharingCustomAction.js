import { ChonkyIconName, defineFileAction } from "chonky";
// import { OpenFilesPayload } from 'chonky/lib/types/action-payloads.types';
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { RadioGroup, FormControlLabel, Radio, Switch } from "@mui/material";
import { Button } from "@mui/material";
import { InputLabel, Typography, Select, MenuItem } from "@mui/material";
import Modal from "@mui/material/Modal";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { IconButton, ListItemSecondaryAction } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
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
@descriptiion: 
The manage sharing component
*/
export function ManageSharingModal(props) {
  const theme = useTheme();
  const themedStyle = style(theme);
  const [open, setOpen] = useState(props.open);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [listUsers, setListUsers] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionChanged, setPermissionChanged] = useState(false);
  const [permission, setPermission] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [editModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  /*
  @descriptiion:
  Initialises the initial sharing state of the component
  */
  useEffect(() => {
    const data = jwtDecode(localStorage.getItem("token"));
    const sender = data["username"];
    const bucket_name = data["bucket_name"];
    const requestBody = {
      user_id: sender,
      file_name: props.sharedFile.id,
      bucket_name: bucket_name,
    };
    axios
      .post("http://localhost:8000/get_shared_file_data", requestBody)
      .then((response) => {
        console.log(response.data);
        setIsPublic(response.data.isPublic);
        if (response.data.isPublic) {
          setPermission("read");
        } else {
          const users = response.data.users.map((user) => user.reciever_id);
          setListUsers(users);
          setUsers((newusers) =>
            newusers.filter((user) => !users.includes(user))
          );
          const perms = response.data.users.map((user) => user.perms);
          setUserPermissions(perms);
          console.log(perms, users);
        }
      });
  }, [props.sharedFile]);

  /*
  @descriptiion:
  Gets the list of users from the backend
  */
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
    window.location.reload();
  };

  /*
  @descriptiion:
  Handles the share button click
  */
  function handleShare() {
    if (isPublic) {
      const data = jwtDecode(localStorage.getItem("token"));
      const sender = data["username"];
      const bucket_name = data["bucket_name"];
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
      return;
    }
    const data = jwtDecode(localStorage.getItem("token"));
    const sender = data["username"];
    const bucket_name = data["bucket_name"];
    const requestBody = {
      user_id: sender,
      bucket_name: bucket_name,
      file_name: props.sharedFile.id,
    };
    axios
      .post("http://localhost:8000/remove_public_file", requestBody)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
    if (selectedUsers.length === 0) {
      return;
    }
    console.log(selectedUsers);
    const requestBody2 = {
      sender_id: sender,
      reciever_id: selectedUsers,
      file_name: props.sharedFile.id,
      bucket_name: bucket_name,
      perms: permission === "read" ? "r" : "w",
    };
    axios
      .post("http://localhost:8000/add_shared_file", requestBody2)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
    handleClose();
  }

  /*
  @descriptiion:
  Handles the edit button click, in the second modal
  */
  const handleClickOpenEdit = (user) => {
    setSelectedUser(user);
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
  };

  /*
  @descriptiion:
  Handles the delete button click,
  Deletes the shared access from the user
  */
  function handleDelete(recieverId) {
    const data = jwtDecode(localStorage.getItem("token"));
    const sender = data["username"];
    const bucket_name = data["bucket_name"];
    const requestBody = {
      sender_id: sender,
      reciever_id: recieverId,
      file_name: props.sharedFile.id,
      bucket_name: bucket_name,
    };
    axios
      .post("http://localhost:8000/remove_shared_file", requestBody)
      .then(function (response) {
        console.log(response);
        handleClose();
      })
      .catch(function (error) {
        console.log(error);
      });
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
            Manage Share {`'` + props.sharedFile.name + `'`}
          </Typography>
          <Box sx={{ marginBottom: "20px" }}>
            <InputLabel id="select-permission-label">
              Manage Public Access
            </InputLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(event) => {
                    setIsPublic(event.target.checked);
                    setPermissionChanged(true);
                  }}
                />
              }
            />
          </Box>
          <InputLabel id="select-users-manage-label">
            People With Access
          </InputLabel>
          <Box sx={{ height: 100, overflow: "auto" }}>
            <List>
              {!isPublic &&
                listUsers.map((user) => (
                  <ListItem button onClick={() => handleClickOpenEdit(user)}>
                    <ListItemText primary={user} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(user)}
                        sx={{ "&:hover": { color: "red" } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
            </List>
          </Box>

          <Dialog open={editModal} onClose={handleCloseEdit}>
            <DialogTitle>Set Permissions for {selectedUser}</DialogTitle>
            <DialogContent>
              <RadioGroup
                aria-label="permissions"
                name="permissions"
                sx={{
                  marginTop: "10px",
                }}
                value={
                  userPermissions[listUsers.indexOf(selectedUser)] === "r"
                    ? "read"
                    : "write"
                }
                row
                onChange={(event) => {
                  const perms = userPermissions;
                  perms[listUsers.indexOf(selectedUser)] = event.target.value;
                  setUserPermissions(perms);
                  setPermissionChanged(true);
                }}
              >
                <FormControlLabel
                  value="read"
                  control={<Radio />}
                  label="Read"
                />
                <FormControlLabel
                  value="write"
                  control={<Radio />}
                  label="Write"
                />
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEdit}>Cancel</Button>
              <Button onClick={handleCloseEdit}>Save</Button>
            </DialogActions>
          </Dialog>
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
              disabled={isPublic}
              options={users}
              getOptionLabel={(option) => (option ? option : "")}
              value={selectedUsers}
              onChange={(event, newValue) => {
                setSelectedUsers(newValue);
                setPermissionChanged(true);
              }}
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
              disabled={!permissionChanged}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

// custom action
export const ManageSharing = defineFileAction(
  {
    id: "manage_sharing",
    button: {
      name: "manage_sharing",
      contextMenu: true,
      toolbar: true,
      group: "Actions",
      icon: ChonkyIconName.symlink,
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
