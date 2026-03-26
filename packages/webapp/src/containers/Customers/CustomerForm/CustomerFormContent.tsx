import { Tab } from "@blueprintjs/core";
import { Card, Group } from "@/components";
import { Tabs } from "@blueprintjs/core";
import { useState } from "react";
import { css } from '@emotion/css';
import { CustomerFloatingActions } from "./CustomerFloatingActions";
import { CustomerFormSections } from "./CustomerFormFields";

const customerFormSections = {
  primary: 'primary',
  financial: 'financial',
  billingAddress: 'billingAddress',
  shippingAddress: 'shippingAddress',
  notes: 'notes',
};
export function CustomerFormContent() {
  const [selectedTabId, setSelectedTabId] = useState(customerFormSections.primary);

  const handleTabChange = (tabId: string) => {
    const sectionId = String(tabId);
    setSelectedTabId(sectionId);

    const section = document.querySelector(
      `[data-section-id="${sectionId}"]`,
    );
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Card className={css`padding-bottom: 0 !important;`}>
      <Group verticalAlign={'top'} alignItems={'flex-start'} flexWrap={'nowrap'}>
          <Tabs
            vertical
            large
            selectedTabId={selectedTabId}
            onChange={handleTabChange}
            className={css`position: sticky; top: 20px; .bp4-large > .bp4-tab{font-size: 14px;} `}
          >
            <Tab id={customerFormSections.primary} title={'Basic'} />
            <Tab id={customerFormSections.financial} title={'Financial'} />
            <Tab id={customerFormSections.billingAddress} title={'Billing address'} />
            <Tab id={customerFormSections.shippingAddress} title={'Ship address'} />
            <Tab id={customerFormSections.notes} title={'Notes'} />
          </Tabs>

        <CustomerFormSections />
      </Group>
      <CustomerFloatingActions />
    </Card>
  )
}
