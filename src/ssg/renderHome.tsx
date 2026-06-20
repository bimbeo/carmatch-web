import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import Home from '../app/pages/Home';
import Fleet from '../app/pages/Fleet';
import B2B from '../app/pages/B2B';
import Contact from '../app/pages/Contact';
import About from '../app/pages/About';
import Partner from '../app/pages/Partner';
import CarDetail from '../app/pages/CarDetail';
import GoWhere from '../app/pages/GoWhere';
import GoWhereCollection from '../app/pages/GoWhereCollection';
import GoWhereDetail from '../app/pages/GoWhereDetail';
import TripFinder from '../app/pages/TripFinder';
import type { TravelContentState } from '../lib/travelContent';

type GlobalWithTravelContent = typeof globalThis & {
  __CM_INITIAL_TRAVEL_CONTENT__?: TravelContentState;
};

function withInitialTravelContent(travelContent: TravelContentState | undefined, render: () => string) {
  if (!travelContent) return render();

  const globalStore = globalThis as GlobalWithTravelContent;
  const previous = globalStore.__CM_INITIAL_TRAVEL_CONTENT__;
  globalStore.__CM_INITIAL_TRAVEL_CONTENT__ = travelContent;

  try {
    return render();
  } finally {
    if (previous) {
      globalStore.__CM_INITIAL_TRAVEL_CONTENT__ = previous;
    } else {
      delete globalStore.__CM_INITIAL_TRAVEL_CONTENT__;
    }
  }
}

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

export function renderContact() {
  return renderToString(
    <MemoryRouter initialEntries={['/lien-he']}>
      <Contact />
    </MemoryRouter>,
  );
}

export function renderAbout() {
  return renderToString(
    <MemoryRouter initialEntries={['/gioi-thieu']}>
      <About />
    </MemoryRouter>,
  );
}

export function renderPartner() {
  return renderToString(
    <MemoryRouter initialEntries={['/hop-tac']}>
      <Partner />
    </MemoryRouter>,
  );
}

export function renderCarDetail(routePath: string, vehicles: unknown[]) {
  globalThis.__CM_INITIAL_VEHICLES__ = vehicles as typeof globalThis.__CM_INITIAL_VEHICLES__;

  try {
    return renderToString(
      <MemoryRouter initialEntries={[routePath]}>
        <Routes>
          <Route path="/xe/:slug" element={<CarDetail />} />
        </Routes>
      </MemoryRouter>,
    );
  } finally {
    delete globalThis.__CM_INITIAL_VEHICLES__;
  }
}

export function renderGoWhere(travelContent?: TravelContentState) {
  return withInitialTravelContent(travelContent, () => renderToString(
    <MemoryRouter initialEntries={['/di-dau']}>
      <GoWhere />
    </MemoryRouter>,
  ));
}

export function renderGoWhereDetail(routePath: string, travelContent?: TravelContentState) {
  return withInitialTravelContent(travelContent, () => renderToString(
    <MemoryRouter initialEntries={[routePath]}>
      <Routes>
        <Route path="/di-dau/:slug" element={<GoWhereDetail />} />
      </Routes>
    </MemoryRouter>,
  ));
}

export function renderGoWhereCollection(routePath: string, travelContent?: TravelContentState) {
  return withInitialTravelContent(travelContent, () => renderToString(
    <MemoryRouter initialEntries={[routePath]}>
      <Routes>
        <Route path="/di-dau/chu-de/:slug" element={<GoWhereCollection />} />
      </Routes>
    </MemoryRouter>,
  ));
}

export function renderTripFinder(routePath: string, vehicles: unknown[]) {
  globalThis.__CM_INITIAL_VEHICLES__ = vehicles as typeof globalThis.__CM_INITIAL_VEHICLES__;

  try {
    return renderToString(
      <MemoryRouter initialEntries={[routePath]}>
        <Routes>
          <Route path="/lap-ke-hoach-chuyen-di" element={<TripFinder />} />
          <Route path="/lap-ke-hoach-chuyen-di/:slug" element={<TripFinder />} />
        </Routes>
      </MemoryRouter>,
    );
  } finally {
    delete globalThis.__CM_INITIAL_VEHICLES__;
  }
}
