import React from 'react';

// Temporary placeholder component for tables during AG-Grid migration
// This prevents compilation errors while we migrate to TanStack Table

interface TempTableProps {
  data?: any[];
  children?: React.ReactNode;
  [key: string]: any;
}

const TempTableStub: React.FC<TempTableProps> = ({ data = [], children, ...props }) => {
  return (
    <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-gray-600">
        <h3 className="text-lg font-medium mb-2">Table Migration in Progress</h3>
        <p className="text-sm">
          This table component is being migrated from AG-Grid to TanStack Table.
        </p>
        <p className="text-sm mt-2">
          Found {data.length} records to display.
        </p>
      </div>
    </div>
  );
};

export default TempTableStub;