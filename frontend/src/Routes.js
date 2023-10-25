import React from "react"
import { Switch, Redirect } from "react-router-dom"
import { RouteWithLayout } from "./components"
import { Minimal as MinimalLayout, AdminMain as AdminMainLayout, ClientMain as ClientMainLayout } from "./layouts"
import * as Commons from "common/common"

import {
  AdminLogin as AdminLoginView,
  AdminOccasions as AdminOccasionsView,
  AdminOccasionDetail as AdminOccasionDetailView,
  ClientLogin as ClientLoginView,
  ClientRegister as ClientRegisterView,
  ClientForgot as ClientForgotView,
  ClientOccasionType as ClientOccasionTypeView,
  ClientOccasions as ClientOccasionsView,
  ClientOccurrenceTime as ClientOccurrenceTimeView,
  ClientOccurrenceDate as ClientOccurrenceDateView,
  ClientOccurrenceConfirm as ClientOccurrenceConfirmView,
  ClientRegisteredOccasion as ClientRegisteredOccasionView,
  NotFound as NotFoundView,
} from "./views"

const Routes = () => {
  return (
    <Switch>
      <Redirect exact from="/" to={Commons.clientLoginRoute} />
      <Redirect exact from="/sys" to={Commons.adminLoginRoute} />
      <RouteWithLayout
        component={AdminLoginView}
        exact
        layout={MinimalLayout}
        path={Commons.adminLoginRoute}
      />
      <RouteWithLayout
        component={AdminOccasionsView}
        exact
        layout={AdminMainLayout}
        path={Commons.adminOccasionsRoute}
      />
      <RouteWithLayout
        component={AdminOccasionDetailView}
        exact
        layout={AdminMainLayout}
        path={`${Commons.adminOccasionsRoute}:id`}
      />
      <RouteWithLayout
        component={ClientLoginView}
        exact
        layout={MinimalLayout}
        path={Commons.clientLoginRoute}
      />
      <RouteWithLayout
        component={ClientRegisterView}
        exact
        layout={MinimalLayout}
        path={Commons.clientRegisterRoute}
      />
      <RouteWithLayout
        component={ClientForgotView}
        exact
        layout={MinimalLayout}
        path={Commons.clientForgotRoute}
      />
      <RouteWithLayout
        component={ClientOccasionTypeView}
        exact
        layout={ClientMainLayout}
        path={`${Commons.clientOccasionsRoute}`}
      />
      <RouteWithLayout
        component={ClientOccasionsView}
        exact
        layout={ClientMainLayout}
        path={`${Commons.clientOccasionsRoute}/:type`}
      />
      <RouteWithLayout
        component={ClientOccurrenceDateView}
        exact
        layout={ClientMainLayout}
        path={`${Commons.clientOccasionsRoute}/:type/:occasionId`}
      />
      <RouteWithLayout
        component={ClientOccurrenceTimeView}
        exact
        layout={ClientMainLayout}
        path={`${Commons.clientOccasionsRoute}/:type/:occasionId/:occurrenceDate`}
      />
      <RouteWithLayout
        component={ClientOccurrenceConfirmView}
        exact
        layout={ClientMainLayout}
        path={`${Commons.clientOccasionsRoute}/:type/:occasionId/:occurrenceDate/:occurrenceTime/:occurrenceId`}
      />
      <RouteWithLayout
        component={ClientRegisteredOccasionView}
        exact
        layout={ClientMainLayout}
        path={`${Commons.clientRegisteredOccasionsRoute}`}
      />
      <RouteWithLayout
        component={NotFoundView}
        exact
        layout={MinimalLayout}
        path={Commons.notFoundRoute}
      />
      <Redirect to={Commons.notFoundRoute} />
    </Switch>
  )
}

export default Routes
