import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import Home from '../app/pages/Home';
import Fleet from '../app/pages/Fleet';
import B2B from '../app/pages/B2B';

export function renderHome(vehicles: unknown[]) {
  globalThis.__CM_INITIAL_VEHICLES__ = vehicles as typeof globalThis.__CM_INITIAL_VEHICLES__;

  try {
    return renderToString(
      <MemoryRouter initialEntries={['/']}>
        <Home />
      </MemoryRouter>,
    );
  } finally {
    delete globalThis.__CM_INITIAL_VEHICLES__;
  }
}

export function renderMonthlyRental(vehicles: unknown[]) {
  globalThis.__CM_INITIAL_VEHICLES__ = vehicles as typeof globalThis.__CM_INITIAL_VEHICLES__;

  try {
    return renderToString(
      <MemoryRouter initialEntries={['/thue-xe-thang']}>
        <B2B />
      </MemoryRouter>,
    );
  } finally {
    delete globalThis.__CM_INITIAL_VEHICLES__;
  }
}

export function renderFleet(vehicles: unknown[]) {
  globalThis.__CM_INITIAL_VEHICLES__ = vehicles as typeof globalThis.__CM_INITIAL_VEHICLES__;

  try {
    return renderToString(
      <MemoryRouter initialEntries={['/xe']}>
        <Fleet />
      </MemoryRouter>,
    );
  } finally {
    delete globalThis.__CM_INITIAL_VEHICLES__;
  }
}
