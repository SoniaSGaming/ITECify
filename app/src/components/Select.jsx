import React, { useState } from "react";

function Select(props) {
  const [selected, setSelected] = useState("");
  //console.log(props.items);
  const handleClick = (item) => {
    setSelected(item);
    props.onSelect(item);
  };
  console.log(selected);
  return (
    <div className="dropdown" >
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        🎨 {selected.length > 0 ? selected : null}
      </button>
      <ul className="dropdown-menu">
        {props.items.map((item, index) => (
          <li key={index}>
            <p
              className="dropdown-item"
              href="#"
              onClick={() => handleClick(item)}
            >
              {item}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Select;
