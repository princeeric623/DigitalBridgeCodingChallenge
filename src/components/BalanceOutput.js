import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as utils from "../utils";

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className="output">
        <p>
          Total Debit: {this.props.totalDebit} Total Credit:{" "}
          {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount ||
            "*"} to {this.props.userInput.endAccount || "*"} from period{" "}
          {utils.dateToString(this.props.userInput.startPeriod)} to{" "}
          {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === "CSV" ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === "HTML" ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string,
  }).isRequired,
};

const generateBalance = (state) => {
  const data = [];
  state.accounts.forEach((element) => {
    const entry = state.journalEntries.filter((i) => {
      const startPeriod = isNaN(state.userInput.startPeriod)
        ? utils.stringToDate("JAN-00")
        : state.userInput.startPeriod;
      const endPeriod = isNaN(state.userInput.endPeriod)
        ? utils.stringToDate("JAN-22")
        : state.userInput.endPeriod;
      return (
        i.ACCOUNT === element.ACCOUNT &&
        startPeriod <= i.PERIOD &&
        endPeriod >= i.PERIOD
      );
    });

    if (entry && entry.length) {
      const CREDIT = entry.reduce((i, next) => i + next.CREDIT, 0);
      const DEBIT = entry.reduce((i, next) => i + next.DEBIT, 0);
      const BALANCE = DEBIT - CREDIT;
      data.push({
        ACCOUNT: element.ACCOUNT,
        DESCRIPTION: element.LABEL,
        CREDIT,
        DEBIT,
        BALANCE,
      });
    }
  });
  return data;
};
const mapStateToProps = (state) => {
  const balance = generateBalance(state).filter((data) => {
    const startAccount = isNaN(state.userInput.startAccount)
      ? 0
      : state.userInput.startAccount;
    const endAccount = isNaN(state.userInput.endAccount)
      ? 100000
      : state.userInput.endAccount;
    return data.ACCOUNT >= startAccount && data.ACCOUNT <= endAccount;
  });
  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);
  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput,
  };
};

export default connect(mapStateToProps)(BalanceOutput);
