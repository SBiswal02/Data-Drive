import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useTheme } from "@mui/material/styles";

const style = (theme) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  display: "flex",
  height: "90vh",
  width: "60%",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  transform: "translate(-50%, -50%)",
  bgcolor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  p: theme.spacing(4),
});

/*
@description:
  This component is used to display generate Modal for Previewing the file
*/
const DisplayModal = (props) => {
  const [open, setOpen] = React.useState(props.open); // boolean value to show or hide the modal
  const [body, setBody] = React.useState(props.body); // body of the modal
  const theme = useTheme();
  const themedStyle = style(theme);
  
  // handles the close modal event
  const handleClose = () => {
    setOpen(false);
    props.setOpen(false);
    setBody("");
  };
  return (
    <Box sx={themedStyle}>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-description"
            sx={{
              mt: 2,
              overflow: "auto",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            {body}
          </Typography>
        </Box>
      </Modal>
    </Box>
  );
};

export default DisplayModal;
