import { useState } from 'react';

const MyTextChange = ({ nameOne, nameTwo, position }) => {
  const [isShown, setIsShown] = useState(false);

  return (
    <div
      className={`relative h-min w-full md:w-3/12  flex flex-col justify-center overflow-hidden font-bold text-3x1 font-antonio text-black  ${position}`}
      onMouseEnter={() => setIsShown(true)}
      onMouseLeave={() => setIsShown(false)}
    >
      <div
        className={`absolute ${
          isShown
            ? 'translate-y-5 duration-1000 ease-in-out'
            : 'translate-y-0 duration-1000 ease-in-out'
        } `}
      >
        {nameOne}
      </div>
      <div
        className={` ${
          isShown
            ? 'translate-y-0 ease-in-out duration-1000'
            : '-translate-y-6 ease-in-out duration-1000'
        } `}
      >
        {nameTwo}
      </div>
    </div>
  );
};

export default MyTextChange;
