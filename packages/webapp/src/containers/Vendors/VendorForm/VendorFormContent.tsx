// @ts-nocheck
import { Tab } from "@blueprintjs/core";
import { Card, Group } from "@/components";
import { Tabs } from "@blueprintjs/core";
import { useState } from "react";
import { css } from '@emotion/css';
import { VendorFloatingActions } from "./VendorFloatingActions";
import { VendorFormSections } from "./VendorFormFields";

const vendorFormSections = {
  primary: 'primary',
  financial: 'financial',
  billingAddress: 'billingAddress',
  shippingAddress: 'shippingAddress',
  notes: 'notes',
};

export function VendorFormContent() {
  const [selectedTabId, setSelectedTabId] = useState(vendorFormSections.primary);

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
          <Tab id={vendorFormSections.primary} title={'Basic'} />
          <Tab id={vendorFormSections.financial} title={'Financial'} />
          <Tab id={vendorFormSections.billingAddress} title={'Billing address'} />
          <Tab id={vendorFormSections.shippingAddress} title={'Ship address'} />
          <Tab id={vendorFormSections.notes} title={'Notes'} />
        </Tabs>

        <VendorFormSections />
      </Group>
      <VendorFloatingActions />
    </Card>
  )
}
