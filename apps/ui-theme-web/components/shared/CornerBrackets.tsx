const CornerBrackets = () => {
  return (
    <>
      <div
        className="absolute top-0 left-0 border-t-2 border-l-2 border-accent"
        style={{
          width: '96px',
          height: '48px',
        }}
      />
      <div
        className="absolute top-0 right-0 border-t-2 border-r-2 border-accent"
        style={{
          width: '96px',
          height: '48px',
        }}
      />
      <div
        className="absolute right-0 bottom-0 hidden border-r-2 border-b-2 border-accent"
        style={{
          width: '48px',
          height: '48px',
        }}
      />
      <div
        className="absolute bottom-0 left-0 hidden border-b-2 border-l-2 border-accent"
        style={{
          width: '48px',
          height: '48px',
        }}
      />
    </>
  );
};

export default CornerBrackets;
