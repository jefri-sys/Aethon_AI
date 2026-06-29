import React from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import StudyGroups from './StudyGroups.jsx';
import MobileStudyGroups from '../../components/mobile/pages/MobileStudyGroups.jsx';
import useMobileView from '../../hooks/useMobileView.js';
import { useAuth } from '../../hooks/useAuth.js';

function Groups() {
  const isMobile = useMobileView();
  const { user } = useAuth();

  if (isMobile) {
    return <MobileStudyGroups user={user} />;
  }

  return (
    <ProtectedPage>
      <StudyGroups />
    </ProtectedPage>
  );
}

export default Groups;
