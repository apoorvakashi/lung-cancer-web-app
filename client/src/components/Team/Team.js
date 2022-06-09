import React from 'react';
import { Grid, Typography } from '@mui/material';
import MemberCard from './MemberCard';
import { projectGuide, teamMembers } from '../../constants/teamMembers';
import {
  guideContainerStyle,
  teamMembersContainerStyle,
  teamMembersTitleStyle,
  titleStyle,
} from './TeamStyle';

const Team = () => {
  return (
    <div>
      <Grid container spacing={2}>
        <Grid item sm={12} sx={guideContainerStyle}>
          <Typography variant="h5" sx={titleStyle}>
            Guide
          </Typography>
          <MemberCard member={projectGuide} />
        </Grid>
        <Grid item sm={12} sx={teamMembersContainerStyle}>
          <Typography sx={{ ...titleStyle, ...teamMembersTitleStyle }} variant="h5">
            Team Members
          </Typography>
          {teamMembers.map((member, index) => (
            <MemberCard key={`member_${index}`} member={member} />
          ))}
        </Grid>
      </Grid>
    </div>
  );
};

export default Team;
