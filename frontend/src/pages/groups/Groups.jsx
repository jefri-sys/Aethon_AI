import React from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import StudyGroups from './StudyGroups.jsx';

function Groups() {
  return (
    <ProtectedPage
      title="Study Groups"
      description="Collaborate with peers, share notes, and discuss course topics together."
    >
      <StudyGroups />
    </ProtectedPage>
  );
}

export default Groups;
