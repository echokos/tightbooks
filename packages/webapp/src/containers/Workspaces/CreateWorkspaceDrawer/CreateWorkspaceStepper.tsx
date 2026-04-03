// @ts-nocheck
import React, { useState } from 'react';
import { Stepper } from '@/components/Stepper';
import { FormattedMessage as T } from '@/components';
import CreateWorkspaceForm from './CreateWorkspaceForm';
import BuildingWorkspaceStep from './BuildingWorkspaceStep';
import InviteUsersStep from './InviteUsersStep';

interface CreateWorkspaceStepperProps {
  onClose: () => void;
}

interface CreatedWorkspace {
  organizationId: string;
  jobId: string;
}

export function CreateWorkspaceStepper({ onClose }: CreateWorkspaceStepperProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [createdWorkspace, setCreatedWorkspace] = useState<CreatedWorkspace | null>(null);

  const handleWorkspaceCreated = (data: CreatedWorkspace) => {
    setCreatedWorkspace(data);
    setStepIndex(1);
  };

  const handleBuildingComplete = () => {
    setStepIndex(2);
  };

  const handleInviteComplete = () => {
    onClose();
  };

  return (
    <Stepper active={stepIndex}>
      <Stepper.Step label={<T id={'create_workspace.steps.workspace'} />}>
        <CreateWorkspaceForm
          onSubmitting={handleWorkspaceCreated}
          onCancel={onClose}
        />
      </Stepper.Step>

      <Stepper.Step label={<T id={'create_workspace.steps.building'} />}>
        <BuildingWorkspaceStep
          jobId={createdWorkspace?.jobId}
          onComplete={handleBuildingComplete}
        />
      </Stepper.Step>

      <Stepper.Step label={<T id={'create_workspace.steps.invite'} />}>
        <InviteUsersStep
          organizationId={createdWorkspace?.organizationId}
          onComplete={handleInviteComplete}
        />
      </Stepper.Step>
    </Stepper>
  );
}
