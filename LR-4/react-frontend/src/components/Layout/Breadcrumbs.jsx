import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

function AppBreadcrumbs({ items }) {
  return (
    <Breadcrumb className="mb-4">
      <LinkContainer to="/">
        <Breadcrumb.Item>Главная</Breadcrumb.Item>
      </LinkContainer>
      
      {items.map((item, index) => (
        item.active ? (
          <Breadcrumb.Item active key={index}>
            {item.label}
          </Breadcrumb.Item>
        ) : (
          <LinkContainer to={item.href} key={index}>
            <Breadcrumb.Item>
              {item.label}
            </Breadcrumb.Item>
          </LinkContainer>
        )
      ))}
    </Breadcrumb>
  );
}

export default AppBreadcrumbs;
