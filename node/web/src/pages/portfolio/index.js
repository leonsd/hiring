import React, { useEffect, useState } from 'react';
import { Input, Row, Col } from 'reactstrap';
import { Formik, Form, ErrorMessage, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import { getQuotation } from '../../services/api/stocks';
import { Button, Table, PageTitle } from '../../components';
import usePersistedState from '../../utils/usePersistedState';

export default function Portfolio() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [stocksNames, setStocksNames] = usePersistedState('stocksNames', []);

  const Schema = Yup.object({
    stockName: Yup.string().required('Obrigatório!')
  });

  const columns = [
    { accessor: 'name', Header: 'Nome' },
    { accessor: 'lastPrice', Header: 'Último preço' },
    {
      accessor: 'pricedAt',
      Header: 'Atualizado em',
      Cell: ({ cell }) => cell.value.split('-').reverse().join('/')
    }
  ];

  async function stockAdd({ stockName }, { resetForm }) {
    if (stocksNames.includes(stockName.toUpperCase())) {
      return toast('Stocks already added to the portfolio', { type: 'warning' })
    }

    try {
      await getAndSetQuotation(stockName);
      setStocksNames([...new Set([...stocksNames, stockName.toUpperCase()])]);
      resetForm();
    } catch (error) { }
  }

  async function getAndSetQuotation(stockName) {
    try {
      setLoading(true);
      const { data } = await getQuotation(stockName);
      setQuotations([...quotations, data]);
    } catch (error) {
      toast(error.response.data.message, { type: 'error' })
      throw error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function getAndSetAllQuotations() {
      try {
        const quotations = stocksNames.map(async (stockName) => {
          const { data } = await getQuotation(stockName);
          return data;
        })

        const data = await Promise.all(quotations)
        setQuotations(data);
      } catch (error) {
        toast(error.response.data.message, { type: 'error' })
      } finally {
        setInitialLoading(false);
      }
    }

    getAndSetAllQuotations();
  }, []); // eslint-disable-line

  return (
    <>
      <PageTitle title='Portifólio' />
      <Formik
        initialValues={{ stockName: '' }}
        validationSchema={Schema}
        onSubmit={stockAdd}
      >
        {() => (
          <Form>
            <Row style={{ marginBottom: 30 }}>
              <Col xs='12'>
                <Row>
                  <Col xs='4'>
                    <Field
                      name='stockName'
                      render={({ field }) => (
                        <Input {...field} placeholder='Nome da ação' />
                      )}
                    />
                    <ErrorMessage
                      name='stockName'
                      component="strong"
                      className='text-danger mt-1'
                    />
                  </Col>
                  <Col xs='2'>
                    <Button
                      type='submit'
                      color='primary'
                      loading={loading}
                      block
                    >
                      Adicionar
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        )}
      </Formik>
      <Table
        columns={columns}
        data={quotations}
        loading={initialLoading}
      />
    </>
  );
}
