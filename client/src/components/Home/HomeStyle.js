export const bannerStyle = {
  backgroundImage: "url('banner.jpg')",
  backgroundSize: 'cover',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export const homeContainerStyle = {
  padding: '1%',
  width: '50%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 20,
};

export const buttonsBoxStyle = {
  width: '400px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '4%',
};

export const buttonStyle = {
  borderWidth: 3,
  flexBasis: '48%',
  fontWeight: 600,

  '&.Mui-disabled': {
    borderWidth: 3,
    backgroundColor: '#a6a6a6',
  },

  '&:hover': {
    borderWidth: 3,
    fontWeight: 600,
  },
};
