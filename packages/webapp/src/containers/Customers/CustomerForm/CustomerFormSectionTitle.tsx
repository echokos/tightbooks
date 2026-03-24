// @ts-nocheck
import React from 'react';
import { css } from '@emotion/css';

const customerFormSectionTitleClass = css`
  font-size: 14px;
  color: #8f99a8;
  margin-bottom: 18px;
  margin-top: 0;
`;

export default function CustomerFormSectionTitle({ children }) {
  return <h4 className={customerFormSectionTitleClass}>{children}</h4>;
}
