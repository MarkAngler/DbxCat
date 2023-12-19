import logo from './logo.svg';
import './App.css';
import { useState, useEffect} from 'react';

let dbxBaseUrl = 'http://localhost:8080/api/';

let getCatalogsBody = {'Url': 'api/2.1/unity-catalog/catalogs',
'Method': 'GET'}

let dbxRequestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(getCatalogsBody),
};


function App() {
  const [catalogNames, setCatalogNames] = useState([]);
  const [error, setError] = useState(null);
  const [catNameExpanded, setCatNameExpanded] = useState(null);
  const [schemaNames, setSchemaNames] = useState({});
  const [tableNames, setTableNames] = useState({});

  useEffect(() => {
    fetch(dbxBaseUrl, dbxRequestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Check if 'catalogs' key exists in the response
        if (data && 'catalogs' in data) {
          const UcNames = data.catalogs.map(catalog => catalog.name);
          setCatalogNames(UcNames);
        } else {
          throw new Error("Response JSON does not have 'catalogs' key");
        }
      })
      .catch(error => {
        console.error('Error: ', error);
        setError(error.message);
      });

      // Empty list -> run once. If no list, runs every time something changes. If variable, runs every time variable changes. 
  }, []);

  const handleCatalogueNameClick = (UcName) => {
    if (catNameExpanded !== UcName) {
      setCatNameExpanded(UcName);
      if (!schemaNames[UcName]) {
        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            url: 'api/2.1/unity-catalog/schemas',
            method: 'GET',
            catalog_name: UcName
          }),
        };

        fetch(dbxBaseUrl, requestOptions)
          .then(response => response.json())
          .then(data => {
            if (data && data.schemas) {
              setSchemaNames(prev => ({ ...prev, [UcName]: data.schemas.map(schema => schema.name) }));
            }
          })
          .catch(error => {
            console.error('Error fetching schemas:', error);
          });
      }
    } else {
      setCatNameExpanded(null);
    }
  };

  const handleSchemaClick = (event, UcName, schemaName) => {
    event.stopPropagation();
    const schemaKey = `${UcName}-${schemaName}`; // Unique key for each catalog-schema pair
    if (!tableNames[schemaKey]) {
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: 'api/2.1/unity-catalog/tables',
          method: 'GET',
          catalog_name: UcName,
          schema_name: schemaName
        }),
      };

      fetch(dbxBaseUrl, requestOptions)
        .then(response => response.json())
        .then(data => {
          if (data && data.tables) {
            setTableNames(prev => ({ ...prev, [schemaKey]: data.tables.map(table => table.name) }));
          }
        })
        .catch(error => {
          console.error('Error fetching tables:', error);
        });
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  

  return (
    <div className="App">
      <header className="App-header">
        <h1>Catalog Names</h1>
        <ul>
          {catalogNames.map(UcName => (
            <li key={`Uc${UcName}`} onClick={() => handleCatalogueNameClick(UcName)}>
              {UcName}
              {catNameExpanded === UcName && (
                <div>
                  More details about {UcName}
                  <ul>
                    {schemaNames[UcName] && schemaNames[UcName].map(schemaName => (
                      <li key={schemaName} onClick={(event) => handleSchemaClick(event, UcName, schemaName)}>
                        {schemaName}
                        {tableNames[`${UcName}-${schemaName}`] && (
                          <ul>
                            {tableNames[`${UcName}-${schemaName}`].map(tableName => <li key={tableName}>{tableName}</li>)}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
