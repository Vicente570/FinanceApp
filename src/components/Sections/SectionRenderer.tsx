import React from 'react';
import { useApp } from '../../context/AppContext';

// Accounts sections
import { AccountsOverview } from './Accounts/AccountsOverview';
import { AccountsAndBudgets } from './Accounts/AccountsAndBudgets';
import { Spending } from './Accounts/Spending';
import { InterpersonalDebts } from './Accounts/InterpersonalDebts';

// Investments sections
import { InvestmentsOverview } from './Investments/InvestmentsOverview';
import { Assets } from './Investments/Assets';
import { Charts as InvestmentCharts } from './Investments/Charts';
import { DebtsAndAssets } from './Investments/DebtsAndAssets';
import { GroupDetail } from './Investments/GroupDetail';

// Statistics sections
import { StatisticsOverview } from './Statistics/StatisticsOverview';
import { Charts as StatisticsCharts } from './Statistics/Charts';
import { DetailedStatistics } from './Statistics/DetailedStatistics';
import { NetWorth } from './Statistics/NetWorth';

// Settings
import { Settings } from './Settings/Settings';

export function SectionRenderer() {
  const { state } = useApp();
  const { navigation } = state;

  // Investments section
  if (navigation.section === 'B') {
    if (navigation.subsubsection === 'group-detail') {
      return <GroupDetail />;
    }
    
    switch (navigation.subsection) {
      case '1':
        return <Assets />;
      case '2':
        return <InvestmentCharts />; // Gráficos de inversiones
      case '3':
        return <DebtsAndAssets />; // Deudas y Patrimonio
      default:
        return <InvestmentsOverview />;
    }
  }

  // Accounts section
  if (navigation.section === 'A') {
    switch (navigation.subsection) {
      case '1':
        return <AccountsAndBudgets />;
      case '2':
        return <Spending />;
      case '3':
        return <InterpersonalDebts />;
      default:
        return <AccountsOverview />;
    }
  }

  // Statistics section
  if (navigation.section === 'C') {
    switch (navigation.subsection) {
      case '1':
        return <StatisticsCharts />; // Gráficos de estadísticas (gastos)
      case '2':
        return <DetailedStatistics />; // Estadísticas detalladas
      case '3':
        return <NetWorth />; // Patrimonio neto
      default:
        return <StatisticsOverview />;
    }
  }

  // Settings section
  if (navigation.section === 'D') {
    return <Settings />;
  }

  return <div>Sección no encontrada</div>;
}