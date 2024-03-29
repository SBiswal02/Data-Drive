import React, { useState, useEffect } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import { jwtDecode } from "jwt-decode";
import { LinearProgress } from "@mui/material";
import { Typography } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import axios from "axios";

/*
Description:
  SideBar component is used to display the sidebar of the application,
  With the options, to navigate between the different tabs - my files, and shared files section

  @props:
  setRootFolderId: function to set the root folder id, when the user navigates through the folders
  collapsed: boolean value to check if the sidebar is collapsed or not
  setCollapsed: function to set the collapsed value
  setTab: function to set the tab value, to navigate between the tabs
*/
export default function SideBar({
  setRootFolderId,
  collapsed,
  setCollapsed,
  setTab,
}) {
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(0);
  const [value, setValue] = useState(0);

  // use effect to get the storage used and storage limit of the user
  useEffect(() => {
    const username = jwtDecode(localStorage.getItem("token"))["username"];
    const request_body = {
      user_id: username,
    };
    axios
      .post("http://localhost:8000/get_storage", request_body)
      .then((response) => {
        setStorageUsed(response.data.used);
        console.log(response.data);
        const storageTotalInGB = (response.data.limit / 1000).toFixed(2);

        setStorageTotal(storageTotalInGB);
        setValue((response.data.used / response.data.limit) * 100);
        console.log(storageTotalInGB);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);
  return (
    <>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
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
        </Menu>
        <Menu>
          <MenuItem
            icon={<HomeIcon />}
            onClick={() => {
              setTab("myfiles");
              const username =
                jwtDecode(localStorage.getItem("token"))["username"] + "/";
              console.log(username);
              setRootFolderId(username);
            }}
          >
            {" "}
            My Files{" "}
          </MenuItem>
          <SubMenu icon={<FolderSharedIcon />} label="Shared Files">
            <MenuItem
              onClick={() => {
                setTab("sharedwithme");
                const username =
                  jwtDecode(localStorage.getItem("token"))["username"] + "/";
                console.log(username);
                setRootFolderId(username);
              }}
            >
              Shared With Me
            </MenuItem>
            <MenuItem
              onClick={() => {
                setTab("sharedbyme");
                const username =
                  jwtDecode(localStorage.getItem("token"))["username"] + "/";
                console.log(username);
                setRootFolderId(username);
              }}
            >
              Shared By Me
            </MenuItem>
          </SubMenu>
          <MenuItem
            icon={<StorageIcon />}
            style={{
              height: "100px",
              marginTop: "10px",
            }}
            onClick={() => setCollapsed(false)}
          >
            <>
              {collapsed ? (
                <></>
              ) : (
                <>
                  <Typography variant="body1">Storage Used</Typography>
                  <LinearProgress variant="determinate" value={value} />
                  <Typography variant="body2">
                    {value.toFixed(2)}% of {storageTotal} GB used
                  </Typography>
                </>
              )}
            </>
          </MenuItem>
        </Menu>
      </Sidebar>
    </>
  );
}
