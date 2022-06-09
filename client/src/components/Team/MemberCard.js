import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Link,
  Typography,
} from '@mui/material';
import { AiFillLinkedin, AiFillGithub } from 'react-icons/ai';
import {
  cardActionsStyle,
  cardContentStyle,
  cardMediaStyle,
  cardStyle,
} from './MemberCardStyle';

const MemberCard = props => {
  const { image, name, role, place, linkedIn, github } = props.member;
  return (
    <Card sx={cardStyle}>
      <CardMedia component="img" src={`/images/${image}`} sx={cardMediaStyle} />
      <CardContent sx={cardContentStyle}>
        <Typography color="primary" variant="h6">
          {name}
        </Typography>
        <Typography variant="subtitle1" color="primary.light">
          {role}
        </Typography>
        <Typography variant="subtitle2" color="primary.light">
          {place}
        </Typography>
        <CardActions sx={cardActionsStyle}>
          <Link href={linkedIn}>
            <AiFillLinkedin size="1.5em" color="#15133c" />
          </Link>
          <Link href={github}>
            <AiFillGithub size="1.5em" color="#15133c" />
          </Link>
        </CardActions>
      </CardContent>
    </Card>
  );
};

MemberCard.propTypes = {
  member: PropTypes.object,
};

export default MemberCard;
