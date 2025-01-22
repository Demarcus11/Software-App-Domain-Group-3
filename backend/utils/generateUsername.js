const generateUsername = ({ firstName, lastName }) => {
  // Format: FirstlastMMYY
  return `${firstName.slice(0, 1)}${lastName.toLowerCase()}${(
    new Date().getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}${new Date().getFullYear().toString().slice(-2)}`;
};

export default generateUsername;
