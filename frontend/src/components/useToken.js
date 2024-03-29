import { useState } from "react";

/*
@description:
  This component is used to generate a token for the user
*/
export default function useToken() {

  // get the token from the local storage
  const getToken = () => {
    const tokenString = localStorage.getItem("token");
    const userToken = JSON.parse(tokenString);
    return userToken;
  };
  // set the token in the local storage
  const [token, setToken] = useState(getToken());

  // save the token in the local storage
  const saveToken = (userToken) => {
    console.log(userToken);
    localStorage.setItem("token", JSON.stringify(userToken));
    setToken(userToken.token);
  };

  // remove the token from the local storage
  const removeToken = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return {
    token,
    removeToken,
    setToken: saveToken,
  };
}
